'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { agentService, Agent, AgentActivity } from '@/lib/services/agentService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function AgentHistoriquePage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params?.id ? parseInt(params.id as string) : null;
  
  const [agent, setAgent] = useState<Agent | null>(null);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'COLLECTE' | 'COMMERCANT' | 'KYC'>('ALL');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    if (agentId) {
      loadData();
    }
  }, [agentId, router]);

  const loadData = async () => {
    if (!agentId) return;
    
    try {
      setLoading(true);
      setError('');
      const [agentData, activityData] = await Promise.all([
        agentService.getById(agentId),
        agentService.getActivity(agentId),
      ]);
      setAgent(agentData);
      setActivities(activityData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const filteredByType = filterType === 'ALL' 
    ? activities 
    : activities.filter(a => a.type === filterType);

  // Filtrer par date
  const filteredActivities = filteredByType.filter(activity => {
    if (!dateDebut && !dateFin) return true;
    
    const activityDate = new Date(activity.dateHeure);
    
    if (dateDebut) {
      const debut = new Date(dateDebut);
      debut.setHours(0, 0, 0, 0);
      if (activityDate < debut) return false;
    }
    
    if (dateFin) {
      const fin = new Date(dateFin);
      fin.setHours(23, 59, 59, 999);
      if (activityDate > fin) return false;
    }
    
    return true;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'COLLECTE':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'COMMERCANT':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'KYC':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'COLLECTE':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'bg-blue-100',
          badge: 'bg-blue-500 text-white',
          text: 'text-blue-700',
        };
      case 'COMMERCANT':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'bg-green-100',
          badge: 'bg-green-500 text-white',
          text: 'text-green-700',
        };
      case 'KYC':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-200',
          icon: 'bg-purple-100',
          badge: 'bg-purple-500 text-white',
          text: 'text-purple-700',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          icon: 'bg-gray-100',
          badge: 'bg-gray-500 text-white',
          text: 'text-gray-700',
        };
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

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fonction d'export PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Titre
    doc.setFontSize(18);
    doc.text(`Historique de l'Agent: ${agent?.nomAgent || ''} (${agent?.codeAgent || ''})`, 14, 22);
    
    // Période
    if (dateDebut || dateFin) {
      doc.setFontSize(12);
      const periode = `Période: ${dateDebut || 'Début'} - ${dateFin || 'Fin'}`;
      doc.text(periode, 14, 30);
    }
    
    // Date d'export
    doc.setFontSize(10);
    doc.text(`Exporté le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 36);
    
    // Préparer les données pour le tableau
    const tableData = filteredActivities.map(activity => {
      const typeLabel = activity.type === 'COLLECTE' ? 'Versement' : activity.type === 'COMMERCANT' ? 'Client' : activity.type;
      return [
        formatDateShort(activity.dateHeure),
        typeLabel,
        activity.description,
        activity.montant ? formatFCFA(activity.montant) : '-',
        activity.statut || '-',
        activity.details || '-',
      ];
    });
    
    // Créer le tableau
    autoTable(doc, {
      head: [['Date', 'Type', 'Description', 'Montant', 'Statut', 'Détails']],
      body: tableData,
      startY: 42,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    
    // Ajouter les totaux
    const totalVersements = filteredActivities.filter(a => a.type === 'COLLECTE' && a.montant).reduce((sum, a) => sum + Number(a.montant || 0), 0);
    const finalY = (doc as any).lastAutoTable?.finalY || 42;
    doc.setFontSize(10);
    doc.text(`Total Activités: ${filteredActivities.length}`, 14, finalY + 10);
    doc.text(`Total Versements: ${filteredActivities.filter(a => a.type === 'COLLECTE').length}`, 14, finalY + 16);
    doc.text(`Total Montant Versé: ${formatFCFA(totalVersements)}`, 14, finalY + 22);
    doc.text(`Total Clients créés: ${filteredActivities.filter(a => a.type === 'COMMERCANT').length}`, 14, finalY + 28);
    
    // Sauvegarder le PDF
    const fileName = `historique_agent_${agent?.nomAgent?.replace(/\s+/g, '_') || 'agent'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Fonction d'export Excel
  const exportToExcel = () => {
    // Préparer les données
    const excelData: Array<Record<string, string | number>> = filteredActivities.map(activity => {
      const typeLabel = activity.type === 'COLLECTE' ? 'Versement' : activity.type === 'COMMERCANT' ? 'Client' : activity.type;
      return {
        'Date': formatDateShort(activity.dateHeure),
        'Type': typeLabel,
        'Description': activity.description,
        'Montant (FCFA)': activity.montant || 0,
        'Statut': activity.statut || '-',
        'Détails': activity.details || '-',
      };
    });
    
    // Ajouter les lignes de totaux
    const totalVersements = filteredActivities.filter(a => a.type === 'COLLECTE' && a.montant).reduce((sum, a) => sum + Number(a.montant || 0), 0);
    
    excelData.push({
      'Date': '',
      'Type': 'TOTAL',
      'Description': '',
      'Montant (FCFA)': totalVersements,
      'Statut': '',
      'Détails': `Total Activités: ${filteredActivities.length} | Versements: ${filteredActivities.filter(a => a.type === 'COLLECTE').length} | Clients: ${filteredActivities.filter(a => a.type === 'COMMERCANT').length}`,
    });
    
    // Créer le workbook
    const wb = XLSX.utils.book_new();
    
    // Créer les données avec en-tête
    const headerRows: string[][] = [
      [`Historique de l'Agent: ${agent?.nomAgent || ''} (${agent?.codeAgent || ''})`],
      dateDebut || dateFin ? [`Période: ${dateDebut || 'Début'} - ${dateFin || 'Fin'}`] : [''],
      [`Exporté le: ${new Date().toLocaleDateString('fr-FR')}`],
      [],
      ['Date', 'Type', 'Description', 'Montant (FCFA)', 'Statut', 'Détails'],
    ];
    
    // Convertir les données en tableau
    const dataRows: (string | number)[][] = excelData.map(row => [
      row['Date'] as string,
      row['Type'] as string,
      row['Description'] as string,
      row['Montant (FCFA)'] as number,
      row['Statut'] as string,
      row['Détails'] as string,
    ]);
    
    // Combiner en-tête et données
    const allRows = [...headerRows, ...dataRows];
    
    // Créer le worksheet
    const ws = XLSX.utils.aoa_to_sheet(allRows);
    
    // Ajouter le worksheet au workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Historique');
    
    // Sauvegarder le fichier
    const fileName = `historique_agent_${agent?.nomAgent?.replace(/\s+/g, '_') || 'agent'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getStatusColor = (statut: string) => {
    if (statut.includes('Validé') || statut.includes('Certifié') || statut === 'VALIDE') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (statut.includes('En_Attente') || statut === 'EN_ATTENTE') {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (statut.includes('Rejeté') || statut === 'REJETE') {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 lg:ml-64">
          <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 lg:ml-64">
          <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-gray-600">Agent non trouvé</p>
            <Link href="/agents" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
              Retour à la liste des agents
            </Link>
          </div>
        </div>
      </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* En-tête */}
          <div className="mb-6">
            <Link 
              href="/agents" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour aux agents
            </Link>
            
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2 flex-wrap">
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h1 className="text-3xl font-bold">Historique d'activité</h1>
                </div>
                <div className="flex space-x-3 mt-4 lg:mt-0">
                  <button
                    onClick={exportToPDF}
                    className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors shadow-md font-medium"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Export PDF
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors shadow-md font-medium"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Excel
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div>
                  <p className="text-blue-100 text-sm">Agent</p>
                  <p className="text-xl font-semibold">{agent.nomAgent}</p>
                </div>
                <div className="h-8 w-px bg-blue-400"></div>
                <div>
                  <p className="text-blue-100 text-sm">Code</p>
                  <p className="text-xl font-semibold">{agent.codeAgent}</p>
                </div>
                <div className="h-8 w-px bg-blue-400"></div>
                <div>
                  <p className="text-blue-100 text-sm">Zone</p>
                  <p className="text-xl font-semibold">{agent.zoneAffectation}</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Filtres */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtres de recherche</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Début</label>
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Fin</label>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  min={dateDebut || undefined}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {(dateDebut || dateFin) && (
              <div className="mb-4">
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Filtrer par type</h2>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous ({activities.length})
                </button>
                <button
                  onClick={() => setFilterType('COLLECTE')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center space-x-2 ${
                    filterType === 'COLLECTE'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Versements ({activities.filter(a => a.type === 'COLLECTE').length})</span>
                </button>
                <button
                  onClick={() => setFilterType('COMMERCANT')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center space-x-2 ${
                    filterType === 'COMMERCANT'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Clients ({activities.filter(a => a.type === 'COMMERCANT').length})</span>
                </button>
                <button
                  onClick={() => setFilterType('KYC')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center space-x-2 ${
                    filterType === 'KYC'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>KYC ({activities.filter(a => a.type === 'KYC').length})</span>
                </button>
              </div>
            </div>
          </div>

          {/* Liste des activités */}
          {filteredActivities.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-600 font-medium text-lg">Aucune activité trouvée</p>
              <p className="text-gray-400 text-sm mt-2">
                {filterType === 'ALL' 
                  ? "Cet agent n'a pas encore d'activité enregistrée"
                  : `Aucune activité de type ${filterType} trouvée`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity, index) => {
                const colors = getActivityColor(activity.type);
                const date = new Date(activity.dateHeure);
                
                return (
                  <div
                    key={index}
                    className={`bg-white rounded-xl shadow-md border-2 ${colors.border} hover:shadow-lg transition-all duration-200 overflow-hidden`}
                  >
                    <div className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Icône */}
                        <div className={`flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center shadow-md ${colors.icon}`}>
                          {getActivityIcon(activity.type)}
                        </div>
                        
                        {/* Contenu principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${colors.badge}`}>
                                {activity.type}
                              </span>
                              {activity.statut && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.statut)}`}>
                                  {activity.statut.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-medium">
                                {date.toLocaleString('fr-FR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                          
                          <h3 className="text-lg font-bold text-gray-900 mb-3">
                            {activity.description}
                          </h3>
                          
                          {/* Détails spécifiques selon le type */}
                          {activity.type === 'COLLECTE' && activity.montant && (
                            <div className="bg-blue-50 rounded-lg p-4 mb-3 border border-blue-100">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Montant versé</p>
                                  <p className="text-2xl font-bold text-blue-600">
                                    {Number(activity.montant).toLocaleString('fr-FR')} FCFA
                                  </p>
                                </div>
                                {activity.details && (
                                  <>
                                    {activity.details.includes('Commerçant:') && (
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">Client</p>
                                        <p className="text-sm font-semibold text-gray-800">
                                          {activity.details.split('Commerçant: ')[1]?.split(' | ')[0] || 'N/A'}
                                        </p>
                                      </div>
                                    )}
                                    {activity.details.includes('Mode de paiement:') && (
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">Mode de paiement</p>
                                        <p className="text-sm font-semibold text-gray-800">
                                          {activity.details.split('Mode de paiement: ')[1] || 'N/A'}
                                        </p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {activity.type === 'COMMERCANT' && (
                            <div className="bg-green-50 rounded-lg p-4 mb-3 border border-green-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {activity.details && (
                                  <>
                                    {activity.details.includes('Nom:') && (
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">Nom complet</p>
                                        <p className="text-sm font-semibold text-gray-800">
                                          {activity.details.split('Nom: ')[1]?.split(' | ')[0] || 'N/A'}
                                        </p>
                                      </div>
                                    )}
                                    {activity.details.includes('Téléphone:') && (
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">Téléphone</p>
                                        <p className="text-sm font-semibold text-gray-800">
                                          {activity.details.split('Téléphone: ')[1]?.split(' | ')[0] || 'N/A'}
                                        </p>
                                      </div>
                                    )}
                                    {activity.details.includes('Zone:') && (
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">Zone</p>
                                        <p className="text-sm font-semibold text-gray-800">
                                          {activity.details.split('Zone: ')[1]?.split(' | ')[0] || 'N/A'}
                                        </p>
                                      </div>
                                    )}
                                    {activity.details.includes('Boutique:') && (
                                      <div>
                                        <p className="text-xs text-gray-600 mb-1">Boutique</p>
                                        <p className="text-sm font-semibold text-gray-800">
                                          {activity.details.split('Boutique: ')[1]?.split(' | ')[0] || 'N/A'}
                                        </p>
                                      </div>
                                    )}
                                  </>
                                )}
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Statut de certification</p>
                                  <p className={`text-sm font-semibold ${
                                    activity.statut === 'Certifié' ? 'text-green-600' : 'text-gray-600'
                                  }`}>
                                    {activity.statut}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {activity.type === 'KYC' && (
                            <div className="bg-purple-50 rounded-lg p-4 mb-3 border border-purple-100">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {activity.details && (
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Type de document</p>
                                    <p className="text-sm font-medium text-gray-800">{activity.details.replace('Type de document: ', '')}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Statut de validation</p>
                                  <p className={`text-sm font-semibold ${
                                    activity.statut === 'VALIDE' ? 'text-green-600' :
                                    activity.statut === 'EN_ATTENTE' ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                    {activity.statut.replace('_', ' ')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {activity.details && activity.type !== 'COLLECTE' && activity.type !== 'COMMERCANT' && activity.type !== 'KYC' && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600 flex items-center">
                                <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {activity.details}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Statistiques rapides */}
          {activities.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Versements</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {activities.filter(a => a.type === 'COLLECTE').length}
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      {activities
                        .filter(a => a.type === 'COLLECTE' && a.montant)
                        .reduce((sum, a) => sum + Number(a.montant || 0), 0)
                        .toLocaleString('fr-FR')} FCFA
                    </p>
                  </div>
                  <div className="text-blue-600">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Clients ajoutés</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {activities.filter(a => a.type === 'COMMERCANT').length}
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      {activities.filter(a => a.type === 'COMMERCANT' && a.statut === 'Certifié').length} certifié(s)
                    </p>
                  </div>
                  <div className="text-green-600">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vérifications KYC</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {activities.filter(a => a.type === 'KYC').length}
                    </p>
                    <p className="text-sm text-purple-600 mt-1">
                      {activities.filter(a => a.type === 'KYC' && a.statut === 'VALIDE').length} validé(s)
                    </p>
                  </div>
                  <div className="text-purple-600">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
  }

