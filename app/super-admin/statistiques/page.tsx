'use client';

import { useEffect, useState } from 'react';
import {
  superAdminStatistiqueService,
  SuperAdminStatistiquesDTO,
  VueEnsembleDTO,
  TopAgentCollecteDTO,
  TopMicrofinanceCollecteDTO,
  ClientStatDTO,
  ModePaiementStatDTO,
  MicrofinanceEcheanceDTO,
  MicrofinanceAgentsDTO,
} from '@/lib/services/superAdminStatistiqueService';

function formatFCFA(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' FCFA';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function SuperAdminStatistiquesPage() {
  const [data, setData] = useState<SuperAdminStatistiquesDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const result = await superAdminStatistiqueService.getStatistiques();
        if (!cancelled) setData(result);
      } catch (err: unknown) {
        const msg = err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string }; status?: number } }).response?.data?.message
          : err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques.';
        if (!cancelled) setError(String(msg));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center min-h-[40vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto" />
            <p className="mt-4 text-gray-600">Chargement des statistiques...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const v = data.vueEnsemble;

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Statistiques globales</h1>
          <p className="text-sm text-gray-500 mt-1">
            Vue d&apos;ensemble et indicateurs pour faciliter les décisions (microfinances, agents, clients, collectes, retraits).
          </p>
        </div>

        {/* Vue d'ensemble - cartes KPIs */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Vue d&apos;ensemble</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Microfinances" value={`${v.nombreMicrofinancesActives} / ${v.nombreMicrofinancesTotal} actives`} sub="" accent="indigo" />
            <KpiCard label="Agents" value={String(v.nombreAgentsTotal)} sub="agents au total" accent="blue" />
            <KpiCard label="Commercants" value={String(v.nombreCommercantsTotal)} sub="clients" accent="green" />
            <KpiCard label="Comptes" value={`${v.nombreComptesActifs} / ${v.nombreComptesTotal} actifs`} sub="" accent="purple" />
            <KpiCard label="Total collectes" value={formatFCFA(v.montantTotalCollectes)} sub={`${v.nombreTotalCollectes} opérations`} accent="green" />
            <KpiCard label="Total retraits" value={formatFCFA(v.montantTotalRetraits)} sub={`${v.nombreTotalRetraits} opérations`} accent="red" />
            <KpiCard label="Solde total comptes" value={formatFCFA(v.soldeTotalComptes)} sub="" accent="blue" />
            <KpiCard label="Frais d'entretien" value={formatFCFA(v.montantTotalFraisEntretien)} sub="perçus au total" accent="amber" />
          </div>
        </section>

        {/* Top agents par collectes */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Agents avec le plus de collectes (montant)</h2>
          <TableAgents items={data.topAgentsParCollectes} formatFCFA={formatFCFA} />
        </section>

        {/* Top microfinances par collectes */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Microfinances par volume de collectes</h2>
          <TableMicrofinances items={data.topMicrofinancesParCollectes} formatFCFA={formatFCFA} />
        </section>

        {/* Clients avec le moins de retraits */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Clients avec le moins de retraits</h2>
          <p className="text-sm text-gray-500 mb-3">Clients qui ont le moins retiré (nombre d&apos;opérations puis montant).</p>
          <TableClients items={data.clientsAvecMoinsRetraits} formatFCFA={formatFCFA} />
        </section>

        {/* Clients avec le plus de retraits */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Clients avec le plus de retraits</h2>
          <TableClients items={data.clientsAvecPlusRetraits} formatFCFA={formatFCFA} />
        </section>

        {/* Top clients par collectes (montant) */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top clients par montant collecté (versements reçus)</h2>
          <TableClients items={data.topClientsParCollectes} formatFCFA={formatFCFA} />
        </section>

        {/* Top clients par nombre de collectes */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top clients par nombre de collectes</h2>
          <TableClients items={data.topClientsParNombreCollectes} formatFCFA={formatFCFA} />
        </section>

        {/* Répartition par mode de paiement */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Répartition des collectes par mode de paiement</h2>
          <TableModePaiement items={data.collectesParModePaiement} formatFCFA={formatFCFA} />
        </section>

        {/* Échéances microfinances */}
        {data.microfinancesEcheance.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Échéances des microfinances</h2>
            <TableEcheances items={data.microfinancesEcheance} formatDate={formatDate} />
          </section>
        )}

        {/* Agents par microfinance */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Agents par microfinance</h2>
          <TableAgentsParMf items={data.agentsParMicrofinance} />
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: 'indigo' | 'blue' | 'green' | 'red' | 'purple' | 'amber';
}) {
  const colors: Record<string, string> = {
    indigo: 'border-indigo-500 bg-indigo-50',
    blue: 'border-blue-500 bg-blue-50',
    green: 'border-green-500 bg-green-50',
    red: 'border-red-500 bg-red-50',
    purple: 'border-purple-500 bg-purple-50',
    amber: 'border-amber-500 bg-amber-50',
  };
  return (
    <div className={`rounded-xl border-l-4 p-4 shadow-sm ${colors[accent] || colors.indigo}`}>
      <p className="text-sm font-medium text-gray-600">{label}</p>
      <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function TableAgents({ items, formatFCFA }: { items: TopAgentCollecteDTO[]; formatFCFA: (n: number) => string }) {
  if (!items.length) return <p className="text-gray-500 text-sm">Aucune donnée.</p>;
  return (
    <div className="table-responsive overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Microfinance</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant collecté</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nb collectes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {items.map((row) => (
            <tr key={row.agentId} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.nomAgent}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{row.codeAgent}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{row.microfinanceNom}</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-green-700">{formatFCFA(row.montantTotalCollectes)}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">{row.nombreCollectes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableMicrofinances({
  items,
  formatFCFA,
}: {
  items: TopMicrofinanceCollecteDTO[];
  formatFCFA: (n: number) => string;
}) {
  if (!items.length) return <p className="text-gray-500 text-sm">Aucune donnée.</p>;
  return (
    <div className="table-responsive overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Microfinance</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant collectes</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nb collectes</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Retraits</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Agents / Clients</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {items.map((row) => (
            <tr key={row.microfinanceId} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">
                {row.nom} {!row.actif && <span className="text-red-600 text-xs">(inactive)</span>}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">{row.code}</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-green-700">{formatFCFA(row.montantTotalCollectes)}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">{row.nombreCollectes}</td>
              <td className="px-4 py-3 text-sm text-right text-red-600">{formatFCFA(row.montantTotalRetraits)} ({row.nombreRetraits})</td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">{row.nombreAgents} / {row.nombreCommercants}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableClients({ items, formatFCFA }: { items: ClientStatDTO[]; formatFCFA: (n: number) => string }) {
  if (!items.length) return <p className="text-gray-500 text-sm">Aucune donnée.</p>;
  return (
    <div className="table-responsive overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Boutique</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Microfinance</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nb opérations</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {items.map((row) => (
            <tr key={row.commercantId} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.nomComplet}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{row.nomBoutique || '—'}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{row.microfinanceNom}</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatFCFA(row.montant)}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">{row.nombreOperations}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableModePaiement({
  items,
  formatFCFA,
}: {
  items: ModePaiementStatDTO[];
  formatFCFA: (n: number) => string;
}) {
  if (!items.length) return <p className="text-gray-500 text-sm">Aucune donnée.</p>;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode de paiement</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Nombre</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {items.map((row) => (
            <tr key={row.modePaiement} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.modePaiement}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">{row.nombre}</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatFCFA(row.montant)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableEcheances({
  items,
  formatDate,
}: {
  items: MicrofinanceEcheanceDTO[];
  formatDate: (s: string) => string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Microfinance</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payé jusqu&apos;au</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {items.map((row) => (
            <tr key={row.microfinanceId} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.nom}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{row.code}</td>
              <td className="px-4 py-3 text-sm text-gray-600">{formatDate(row.dateFinValidite)}</td>
              <td className="px-4 py-3">
                {row.expiree ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Expirée</span>
                ) : row.bientotExpiree ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">Bientôt</span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">OK</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TableAgentsParMf({ items }: { items: MicrofinanceAgentsDTO[] }) {
  if (!items.length) return <p className="text-gray-500 text-sm">Aucune donnée.</p>;
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Microfinance</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Agents actifs</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total agents</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {items.map((row) => (
            <tr key={row.microfinanceId} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.nom}</td>
              <td className="px-4 py-3 text-sm text-right text-green-600">{row.nombreAgentsActifs}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">{row.nombreAgentsTotal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
