'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AgentSidebar from '@/components/AgentSidebar';
import { collecteService, Collecte } from '@/lib/services/collecteService';
import { Agent } from '@/lib/services/agentService';
import { getCurrentAgent } from '@/lib/utils/agentUtils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function AgentCollectesPage() {
  const router = useRouter();
  const [collectes, setCollectes] = useState<Collecte[]>([]);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Récupérer l'agent actuel
      const agentConnecte = await getCurrentAgent();

      if (!agentConnecte) {
        throw new Error('Agent non trouvé. Veuillez vous reconnecter.');
      }

      setAgent(agentConnecte);

      // Charger les versements de l'agent
      const collectesData = await collecteService.getByAgent(agentConnecte.idAgent);
      
      // Trier par date (plus récent en premier)
      const sorted = collectesData.sort((a, b) => {
        const dateA = new Date(a.dateCollecte).getTime();
        const dateB = new Date(b.dateCollecte).getTime();
        return dateB - dateA;
      });
      
      setCollectes(sorted);
    } catch (err: unknown) {
      console.error('Erreur:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatFCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('XOF', 'FCFA');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };


  const filteredCollectes = collectes.filter(collecte => {
    // Filtre par recherche
    const matchSearch = 
      collecte.compte.commerçant.nomComplet.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collecte.compte.numeroCompte.includes(searchTerm) ||
      formatFCFA(collecte.montant).includes(searchTerm);

    // Filtre par date
    let matchDate = true;
    if (dateDebut || dateFin) {
      const collecteDate = new Date(collecte.dateCollecte);
      if (dateDebut) {
        const debut = new Date(dateDebut);
        debut.setHours(0, 0, 0, 0);
        if (collecteDate < debut) matchDate = false;
      }
      if (dateFin) {
        const fin = new Date(dateFin);
        fin.setHours(23, 59, 59, 999);
        if (collecteDate > fin) matchDate = false;
      }
    }

    return matchSearch && matchDate;
  });

  const totalVersement = filteredCollectes.reduce((sum, c) => sum + c.montant, 0);

  // Fonction d'export PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(18);
    doc.text('Historique des Versements', 14, 22);
    
    // Informations de l'agent
    if (agent) {
      doc.setFontSize(12);
      doc.text(`Agent: ${agent.nomAgent} (${agent.codeAgent})`, 14, 30);
    }
    
    // Période
    if (dateDebut || dateFin) {
      const periode = `Période: ${dateDebut || 'Début'} - ${dateFin || 'Fin'}`;
      doc.text(periode, 14, 36);
    }
    
    // Date d'export
    doc.setFontSize(10);
    doc.text(`Exporté le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 42);
    
    // Préparer les données pour le tableau
    const tableData = filteredCollectes.map(collecte => [
      formatDateShort(collecte.dateCollecte),
      collecte.compte.commerçant.nomComplet,
      collecte.compte.numeroCompte,
      formatFCFA(collecte.montant),
      collecte.modePaiement,
    ]);
    
    // Créer le tableau
    autoTable(doc, {
      head: [['Date', 'Client', 'Numéro Compte', 'Montant', 'Mode de Paiement']],
      body: tableData,
      startY: 48,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    
    // Ajouter les totaux
    const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY || 48;
    doc.setFontSize(10);
    doc.text(`Total Versements: ${filteredCollectes.length}`, 14, finalY + 10);
    doc.text(`Total Montant: ${formatFCFA(totalVersement)}`, 14, finalY + 16);
    
    // Sauvegarder le PDF
    const fileName = `versements_${agent?.codeAgent || 'agent'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Fonction d'export Excel
  const exportToExcel = () => {
    // Préparer les données
    const excelData: Array<Record<string, string | number>> = filteredCollectes.map(collecte => ({
      'Date': formatDateShort(collecte.dateCollecte),
      'Client': collecte.compte.commerçant.nomComplet,
      'Numéro Compte': collecte.compte.numeroCompte,
      'Montant (FCFA)': collecte.montant,
      'Mode de Paiement': collecte.modePaiement,
    }));
    
    // Ajouter une ligne de totaux
    excelData.push({
      'Date': '',
      'Client': '',
      'Numéro Compte': 'TOTAL',
      'Montant (FCFA)': totalVersement,
      'Mode de Paiement': '',
    });
    
    // Créer le workbook
    const wb = XLSX.utils.book_new();
    
    // Créer les données avec en-tête
    const headerRows: string[][] = [
      ['Historique des Versements'],
      agent ? [`Agent: ${agent.nomAgent} (${agent.codeAgent})`] : [''],
      dateDebut || dateFin ? [`Période: ${dateDebut || 'Début'} - ${dateFin || 'Fin'}`] : [''],
      [`Exporté le: ${new Date().toLocaleDateString('fr-FR')}`],
      [],
      ['Date', 'Client', 'Numéro Compte', 'Montant (FCFA)', 'Mode de Paiement'],
    ];
    
    // Convertir les données en tableau
    const dataRows: (string | number)[][] = excelData.map(row => [
      row['Date'] as string,
      row['Client'] as string,
      row['Numéro Compte'] as string,
      row['Montant (FCFA)'] as number,
      row['Mode de Paiement'] as string,
    ]);
    
    // Combiner en-tête et données
    const allRows = [...headerRows, ...dataRows];
    
    // Créer le worksheet
    const ws = XLSX.utils.aoa_to_sheet(allRows);
    
    // Ajouter le worksheet au workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Versements');
    
    // Sauvegarder le fichier
    const fileName = `versements_${agent?.codeAgent || 'agent'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AgentSidebar />
      <div className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Historique des Versements</h1>
              <p className="mt-2 text-gray-600">
                {agent && `Agent: ${agent.nomAgent} (${agent.codeAgent})`}
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={exportToPDF}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Export PDF
              </button>
              <button
                onClick={exportToExcel}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600">Total Versements</p>
              <p className="text-2xl font-bold text-gray-900">{filteredCollectes.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
              <p className="text-sm text-green-600">Total Versé</p>
              <p className="text-2xl font-bold text-green-800">{formatFCFA(totalVersement)}</p>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Filtres de recherche</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
                <input
                  type="text"
                  placeholder="Rechercher par client, compte ou montant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Début</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Fin</label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  min={dateDebut || undefined}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
            {(dateDebut || dateFin) && (
              <div className="mt-4 flex items-center space-x-2">
                <button
                  onClick={() => {
                    setDateDebut('');
                    setDateFin('');
                  }}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Réinitialiser les dates
                </button>
              </div>
            )}
          </div>

          {/* Liste des versements */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {filteredCollectes.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Aucun versement trouvé
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Numéro Compte
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mode de Paiement
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCollectes.map((collecte) => (
                      <tr key={collecte.idCollecte} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(collecte.dateCollecte)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {collecte.compte.commerçant.nomComplet}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {collecte.compte.numeroCompte}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                          {formatFCFA(collecte.montant)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {collecte.modePaiement}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
