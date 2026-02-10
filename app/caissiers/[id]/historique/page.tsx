'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { utilisateurService, User } from '@/lib/services/utilisateurService';
import { retraitService, Retrait } from '@/lib/services/retraitService';
import { collecteService, Collecte } from '@/lib/services/collecteService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function CaissierHistoriquePage() {
  const router = useRouter();
  const params = useParams();
  const utilisateurId = params?.id ? parseInt(params.id as string) : null;
  
  const [caissier, setCaissier] = useState<User | null>(null);
  const [retraits, setRetraits] = useState<Retrait[]>([]);
  const [collectes, setCollectes] = useState<Collecte[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'RETRAIT' | 'VERSEMENT'>('ALL');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    if (utilisateurId) {
      loadData();
    }
  }, [utilisateurId, router]);

  const loadData = async () => {
    if (!utilisateurId) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Charger les données du caissier et ses activités
      const [caissierData, retraitsData, allCollectes] = await Promise.all([
        utilisateurService.getById(utilisateurId),
        retraitService.getByUtilisateur(utilisateurId),
        collecteService.getAll(), // Charger toutes les collectes pour filtrer ensuite
      ]);
      
      setCaissier(caissierData);
      setRetraits(retraitsData || []);
      
      // Filtrer les collectes (versements) créées par ce caissier
      // Note: Les versements sont créés via /collectes/versement par le caissier
      // On va afficher toutes les collectes récentes (car il n'y a pas de lien direct vers l'utilisateur)
      // En production, il faudrait un endpoint backend pour récupérer les collectes par utilisateur
      setCollectes(allCollectes || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // Créer une liste combinée de toutes les activités (retraits et collectes)
  type Activity = {
    type: 'RETRAIT' | 'VERSEMENT';
    id: number;
    date: Date;
    montant: number;
    data: Retrait | Collecte;
  };

  const allActivities: Activity[] = [
    ...retraits.map(r => ({
      type: 'RETRAIT' as const,
      id: r.idRetrait,
      date: new Date(r.dateRetrait),
      montant: Number(r.montant),
      data: r,
    })),
    ...collectes.map(c => ({
      type: 'VERSEMENT' as const,
      id: c.idCollecte,
      date: new Date(c.dateCollecte),
      montant: Number(c.montant),
      data: c,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime()); // Tri décroissant par date

  // Filtrer par type
  const filteredByType = filterType === 'ALL' 
    ? allActivities 
    : allActivities.filter(a => a.type === filterType);

  // Filtrer par date
  const filteredActivities = filteredByType.filter(activity => {
    if (!dateDebut && !dateFin) return true;
    
    const activityDate = activity.date;
    
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

  const totalRetrait = retraits.reduce((sum, r) => sum + Number(r.montant), 0);
  const totalVersement = collectes.reduce((sum, c) => sum + Number(c.montant), 0);

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
    doc.text(`Historique du Caissier: ${caissier?.email || ''}`, 14, 22);
    
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
      if (activity.type === 'VERSEMENT') {
        const collecte = activity.data as Collecte;
        return [
          formatDateShort(collecte.dateCollecte),
          'Versement',
          collecte.compte.numeroCompte,
          collecte.compte.commerçant?.nomComplet || '-',
          formatFCFA(collecte.montant),
          collecte.modePaiement,
        ];
      } else {
        const retrait = activity.data as Retrait;
        return [
          formatDateShort(retrait.dateRetrait),
          'Retrait',
          retrait.compte.numeroCompte,
          retrait.compte.commerçant?.nomComplet || '-',
          formatFCFA(retrait.montant),
          retrait.motif || '-',
        ];
      }
    });
    
    // Créer le tableau
    autoTable(doc, {
      head: [['Date', 'Type', 'Numéro Compte', 'Client', 'Montant', 'Détails']],
      body: tableData,
      startY: 42,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });
    
    // Ajouter les totaux
    const totalVersements = filteredActivities.filter(a => a.type === 'VERSEMENT').reduce((sum, a) => sum + a.montant, 0);
    const totalRetraits = filteredActivities.filter(a => a.type === 'RETRAIT').reduce((sum, a) => sum + a.montant, 0);
    const finalY = (doc as any).lastAutoTable?.finalY || 42;
    doc.setFontSize(10);
    doc.text(`Total Versements: ${filteredActivities.filter(a => a.type === 'VERSEMENT').length}`, 14, finalY + 10);
    doc.text(`Total Montant Versé: ${formatFCFA(totalVersements)}`, 14, finalY + 16);
    doc.text(`Total Retraits: ${filteredActivities.filter(a => a.type === 'RETRAIT').length}`, 14, finalY + 22);
    doc.text(`Total Montant Retiré: ${formatFCFA(totalRetraits)}`, 14, finalY + 28);
    
    // Sauvegarder le PDF
    const fileName = `historique_caissier_${caissier?.email?.replace(/[@.]/g, '_') || 'caissier'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  // Fonction d'export Excel
  const exportToExcel = () => {
    // Préparer les données
    const excelData: Array<Record<string, string | number>> = filteredActivities.map(activity => {
      if (activity.type === 'VERSEMENT') {
        const collecte = activity.data as Collecte;
        return {
          'Date': formatDateShort(collecte.dateCollecte),
          'Type': 'Versement',
          'Numéro Compte': collecte.compte.numeroCompte,
          'Client': collecte.compte.commerçant?.nomComplet || '-',
          'Montant (FCFA)': collecte.montant,
          'Mode de Paiement': collecte.modePaiement,
        };
      } else {
        const retrait = activity.data as Retrait;
        return {
          'Date': formatDateShort(retrait.dateRetrait),
          'Type': 'Retrait',
          'Numéro Compte': retrait.compte.numeroCompte,
          'Client': retrait.compte.commerçant?.nomComplet || '-',
          'Montant (FCFA)': retrait.montant,
          'Motif': retrait.motif || '-',
        };
      }
    });
    
    // Ajouter les lignes de totaux
    const totalVersements = filteredActivities.filter(a => a.type === 'VERSEMENT').reduce((sum, a) => sum + a.montant, 0);
    const totalRetraits = filteredActivities.filter(a => a.type === 'RETRAIT').reduce((sum, a) => sum + a.montant, 0);
    
    excelData.push({
      'Date': '',
      'Type': 'TOTAL VERSEMENTS',
      'Numéro Compte': '',
      'Client': '',
      'Montant (FCFA)': totalVersements,
      'Mode de Paiement': '',
    });
    
    excelData.push({
      'Date': '',
      'Type': 'TOTAL RETRAITS',
      'Numéro Compte': '',
      'Client': '',
      'Montant (FCFA)': totalRetraits,
      'Motif': '',
    });
    
    // Créer le workbook
    const wb = XLSX.utils.book_new();
    
    // Créer les données avec en-tête
    const headerRows: string[][] = [
      [`Historique du Caissier: ${caissier?.email || ''}`],
      dateDebut || dateFin ? [`Période: ${dateDebut || 'Début'} - ${dateFin || 'Fin'}`] : [''],
      [`Exporté le: ${new Date().toLocaleDateString('fr-FR')}`],
      [],
      ['Date', 'Type', 'Numéro Compte', 'Client', 'Montant (FCFA)', 'Détails'],
    ];
    
    // Convertir les données en tableau
    const dataRows: (string | number)[][] = excelData.map(row => [
      row['Date'] as string,
      row['Type'] as string,
      row['Numéro Compte'] as string,
      row['Client'] as string,
      row['Montant (FCFA)'] as number,
      (row['Mode de Paiement'] || row['Motif']) as string,
    ]);
    
    // Combiner en-tête et données
    const allRows = [...headerRows, ...dataRows];
    
    // Créer le worksheet
    const ws = XLSX.utils.aoa_to_sheet(allRows);
    
    // Ajouter le worksheet au workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Historique');
    
    // Sauvegarder le fichier
    const fileName = `historique_caissier_${caissier?.email?.replace(/[@.]/g, '_') || 'caissier'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="page-with-sidebar">
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

  if (!caissier) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="page-with-sidebar">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-gray-600">Caissier non trouvé</p>
              <Link href="/caissiers" className="text-blue-600 hover:text-blue-800 mt-4 inline-block">
                Retour à la liste des caissiers
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
      <div className="page-with-sidebar">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* En-tête */}
          <div className="mb-6">
            <Link 
              href="/caissiers" 
              className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Retour aux caissiers
            </Link>
            
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-2 flex-wrap">
                <div className="flex items-center space-x-3">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <h1 className="text-3xl font-bold">Historique du Caissier</h1>
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
              <div className="flex items-center space-x-4 flex-wrap">
                <div>
                  <p className="text-blue-100 text-sm">Caissier</p>
                  <p className="text-xl font-semibold">{caissier.email}</p>
                </div>
                <div className="h-8 w-px bg-blue-400"></div>
                <div>
                  <p className="text-blue-100 text-sm">Rôle</p>
                  <p className="text-xl font-semibold">{caissier.role}</p>
                </div>
                <div className="h-8 w-px bg-blue-400"></div>
                <div>
                  <p className="text-blue-100 text-sm">Statut</p>
                  <p className="text-xl font-semibold">{caissier.statutUtilisateur}</p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total retraits</p>
                  <p className="text-2xl font-bold text-gray-900">{retraits.length}</p>
                </div>
                <div className="text-red-600">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total versements</p>
                  <p className="text-2xl font-bold text-gray-900">{collectes.length}</p>
                </div>
                <div className="text-blue-600">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Montant retiré</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalRetrait.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <div className="text-orange-600">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Montant versé</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {totalVersement.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <div className="text-green-600">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Filtrer par type</h2>
              <div className="flex space-x-2 flex-wrap">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'ALL'
                      ? 'bg-gray-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tous ({allActivities.length})
                </button>
                <button
                  onClick={() => setFilterType('RETRAIT')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'RETRAIT'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Retraits ({retraits.length})
                </button>
                <button
                  onClick={() => setFilterType('VERSEMENT')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterType === 'VERSEMENT'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Versements ({collectes.length})
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
                  ? "Ce caissier n'a pas encore d'activité enregistrée"
                  : filterType === 'RETRAIT'
                  ? "Ce caissier n'a pas encore effectué de retrait"
                  : "Ce caissier n'a pas encore effectué de versement"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((activity) => {
                if (activity.type === 'RETRAIT') {
                  const retrait = activity.data as Retrait;
                  const date = new Date(retrait.dateRetrait);
                  
                  return (
                    <div
                      key={`retrait-${retrait.idRetrait}`}
                      className="bg-white rounded-xl shadow-md border-2 border-red-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start space-x-4">
                          {/* Icône */}
                          <div className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center shadow-md bg-red-100 text-red-600">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          
                          {/* Contenu principal */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-500 text-white">
                                  RETRAIT
                                </span>
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
                              Retrait effectué
                            </h3>
                            
                            {/* Détails du retrait */}
                            <div className="bg-red-50 rounded-lg p-4 mb-3 border border-red-100">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Montant retiré</p>
                                  <p className="text-2xl font-bold text-red-600">
                                    {Number(retrait.montant).toLocaleString('fr-FR')} FCFA
                                  </p>
                                </div>
                                {retrait.motif && (
                                  <div>
                                    <p className="text-xs text-gray-600 mb-1">Motif</p>
                                    <p className="text-sm font-semibold text-gray-800">
                                      {retrait.motif}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Client</p>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {retrait.compte.commerçant?.nomComplet || '-'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {retrait.compte && retrait.compte.numeroCompte && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-600 flex items-center">
                                  <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                  Numéro de compte: <span className="font-semibold ml-1">{retrait.compte.numeroCompte}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                } else {
                  const collecte = activity.data as Collecte;
                  const date = new Date(collecte.dateCollecte);
                  
                  return (
                    <div
                      key={`collecte-${collecte.idCollecte}`}
                      className="bg-white rounded-xl shadow-md border-2 border-blue-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start space-x-4">
                          {/* Icône */}
                          <div className="flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center shadow-md bg-blue-100 text-blue-600">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          
                          {/* Contenu principal */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500 text-white">
                                  VERSEMENT
                                </span>
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
                              Versement effectué
                            </h3>
                            
                            {/* Détails de la collecte */}
                            <div className="bg-blue-50 rounded-lg p-4 mb-3 border border-blue-100">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Montant versé</p>
                                  <p className="text-2xl font-bold text-blue-600">
                                    {Number(collecte.montant).toLocaleString('fr-FR')} FCFA
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Mode de paiement</p>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {collecte.modePaiement.replace('_', ' ')}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-600 mb-1">Client</p>
                                  <p className="text-sm font-semibold text-gray-800">
                                    {collecte.compte.commerçant?.nomComplet || '-'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {collecte.compte && collecte.compte.numeroCompte && (
                              <div className="mt-3">
                                <p className="text-sm text-gray-600 flex items-center">
                                  <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                  </svg>
                                  Numéro de compte: <span className="font-semibold ml-1">{collecte.compte.numeroCompte}</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
