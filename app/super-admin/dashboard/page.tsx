'use client';

import { useEffect, useState } from 'react';
import {
  microfinanceService,
  Microfinance,
  CreateMicrofinanceRequest,
  UpdateMicrofinanceRequest,
} from '@/lib/services/microfinanceService';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function isExpired(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

/** Statut de la date d'échéance pour affichage couleur : expiré, bientôt (≤5 jours), ok */
function getDateStatus(dateStr: string | null): 'expired' | 'warning' | 'ok' {
  if (!dateStr) return 'ok';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(0, 0, 0, 0);
  if (end < today) return 'expired';
  const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  return daysLeft <= 5 ? 'warning' : 'ok';
}

export default function SuperAdminDashboardPage() {
  const [microfinances, setMicrofinances] = useState<Microfinance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<CreateMicrofinanceRequest>({
    nom: '',
    code: '',
    contact: '',
    actif: true,
    dateFinValidite: null,
    adminEmail: '',
    adminPassword: '',
    adminNom: '',
  });
  const [editingDateForId, setEditingDateForId] = useState<number | null>(null);
  const [editingDateValue, setEditingDateValue] = useState('');
  const [savingDate, setSavingDate] = useState(false);

  const loadMicrofinances = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await microfinanceService.getAll();
      setMicrofinances(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Erreur lors du chargement des microfinances. Vérifiez que le backend expose GET /api/super-admin/microfinances.';
      setError(msg);
      setMicrofinances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMicrofinances();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await microfinanceService.create({
        ...form,
        dateFinValidite: form.dateFinValidite || undefined,
      });
      setShowForm(false);
      setForm({
        nom: '',
        code: '',
        contact: '',
        actif: true,
        dateFinValidite: null,
        adminEmail: '',
        adminPassword: '',
        adminNom: '',
      });
      await loadMicrofinances();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Erreur lors de la création de la microfinance.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleActiver = async (id: number) => {
    try {
      await microfinanceService.activer(id);
      await loadMicrofinances();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erreur');
    }
  };

  const handleDesactiver = async (id: number) => {
    try {
      await microfinanceService.desactiver(id);
      await loadMicrofinances();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erreur');
    }
  };

  const startEditDate = (mf: Microfinance) => {
    setEditingDateForId(mf.id);
    setEditingDateValue(mf.dateFinValidite || '');
  };

  const cancelEditDate = () => {
    setEditingDateForId(null);
    setEditingDateValue('');
  };

  const saveDateEcheance = async (id: number) => {
    setSavingDate(true);
    setError('');
    try {
      const payload: UpdateMicrofinanceRequest = {
        dateFinValidite: editingDateValue || null,
      };
      await microfinanceService.update(id, payload);
      setEditingDateForId(null);
      setEditingDateValue('');
      await loadMicrofinances();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Erreur lors de la mise à jour de l\'échéance.');
    } finally {
      setSavingDate(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Microfinances</h1>
            <p className="text-sm text-gray-500 mt-1">
              Créer et gérer les accès des microfinances (activation / désactivation)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700"
          >
            {showForm ? 'Annuler' : '+ Nouvelle microfinance'}
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {showForm && (
          <div className="mb-6 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Créer une microfinance et son admin
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de la microfinance
                  </label>
                  <input
                    type="text"
                    required
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                  <input
                    type="text"
                    required
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
                <input
                  type="text"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                  value={form.contact}
                  onChange={(e) => setForm({ ...form, contact: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email admin
                  </label>
                  <input
                    type="email"
                    required
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe admin
                  </label>
                  <input
                    type="password"
                    required
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    value={form.adminPassword}
                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l&apos;admin
                  </label>
                  <input
                    type="text"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                    value={form.adminNom}
                    onChange={(e) => setForm({ ...form, adminNom: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payé jusqu&apos;au (optionnel)
                </label>
                <input
                  type="date"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900"
                  value={form.dateFinValidite || ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      dateFinValidite: e.target.value || null,
                    })
                  }
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? 'Création...' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : microfinances.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center text-gray-500">
            Aucune microfinance. Créez-en une avec le bouton ci-dessus (une fois le backend
            configuré).
          </div>
        ) : (
          <div className="table-responsive bg-white rounded-2xl shadow-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Microfinance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Payé jusqu&apos;au
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {microfinances.map((mf) => {
                  const expired = isExpired(mf.dateFinValidite);
                  const inactive = !mf.actif || expired;
                  return (
                    <tr key={mf.id} className={inactive ? 'bg-red-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {mf.nom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {mf.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {mf.adminEmail || mf.adminNom || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {editingDateForId === mf.id ? (
                          <div className="flex flex-col gap-2">
                            <input
                              type="date"
                              className="rounded border border-gray-300 px-2 py-1 text-gray-900 text-sm"
                              value={editingDateValue}
                              onChange={(e) => setEditingDateValue(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={savingDate}
                                onClick={() => saveDateEcheance(mf.id)}
                                className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                              >
                                {savingDate ? 'Enregistrement...' : 'Enregistrer'}
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditDate}
                                className="text-xs px-2 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span
                              className={
                                getDateStatus(mf.dateFinValidite) === 'expired'
                                  ? 'font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded'
                                  : getDateStatus(mf.dateFinValidite) === 'warning'
                                    ? 'font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded'
                                    : 'text-gray-700'
                              }
                            >
                              {formatDate(mf.dateFinValidite)}
                            </span>
                            {expired && (
                              <span className="ml-1 text-red-600 text-xs font-medium">(expiré)</span>
                            )}
                            <button
                              type="button"
                              onClick={() => startEditDate(mf)}
                              className="ml-2 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                            >
                              Modifier échéance
                            </button>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            inactive
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {inactive ? 'Inactif' : 'Actif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {mf.actif ? (
                          <button
                            type="button"
                            onClick={() => handleDesactiver(mf.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Désactiver
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleActiver(mf.id)}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Activer
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
