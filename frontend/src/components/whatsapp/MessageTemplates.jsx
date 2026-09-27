import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappApi } from '@/lib/api';
import { Pencil, Eye, Save, MessageSquare } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import Loader from '@/components/shared/Loader';
import toast from 'react-hot-toast';

function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 flex-shrink-0 overflow-hidden rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-primary-600' : 'bg-secondary-300'
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function MessageTemplates() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [body, setBody] = useState('');
  const [autoSend, setAutoSend] = useState(false);
  const [preview, setPreview] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: () => whatsappApi.getTemplates(),
  });

  const templates = data?.data || [];
  const placeholders = data?.placeholders || [];

  const saveMutation = useMutation({
    mutationFn: ({ status, ...payload }) => whatsappApi.updateTemplate(status, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-templates'] });
      toast.success('Plantilla guardada');
      setEditing(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const previewMutation = useMutation({
    mutationFn: (payload) => whatsappApi.previewTemplate(payload),
    onSuccess: (res) => setPreview(res.data.rendered),
    onError: (err) => toast.error(err.message),
  });

  function openEditor(template) {
    setEditing(template);
    setBody(template.body);
    setAutoSend(template.autoSend);
    setPreview('');
  }

  function toggleAutoSend(template) {
    saveMutation.mutate({
      status: template.status,
      body: template.body,
      autoSend: !template.autoSend,
    });
  }

  return (
    <>
      <div className="card mt-6">
        <div className="card-header">
          <h2 className="font-semibold text-secondary-900">Plantillas de mensajes</h2>
          <p className="text-sm text-secondary-500 mt-1">
            Un mensaje por estado. Se envía automáticamente al cambiar el estado, si lo dejas activo.
          </p>
        </div>
        <div className="card-body">
          {isLoading ? (
            <Loader />
          ) : (
            <div className="divide-y divide-secondary-100">
              {templates.map((template) => (
                <div key={template.status} className="flex items-center gap-3 py-3">
                  <StatusBadge status={template.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900">{template.label}</p>
                    <p className="text-xs text-secondary-400 truncate">
                      {template.autoSend ? 'Envío automático activo' : 'Solo envío manual'}
                      {template.customized ? ' · personalizada' : ' · predeterminada'}
                    </p>
                  </div>
                  <Toggle
                    checked={template.autoSend}
                    disabled={saveMutation.isPending}
                    onChange={() => toggleAutoSend(template)}
                    label={`Envío automático para ${template.label}`}
                  />
                  <Button variant="ghost" size="sm" onClick={() => openEditor(template)} title="Editar plantilla">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing ? `Mensaje: ${editing.label}` : ''}
        size="lg"
      >
        {editing && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">Mensaje</label>
              <textarea
                rows={12}
                className="block w-full rounded-lg border border-secondary-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={body}
                onChange={(e) => { setBody(e.target.value); setPreview(''); }}
              />
              <p className="text-xs text-secondary-400 mt-1">
                Usa <code className="bg-secondary-100 px-1 rounded">*texto*</code> para negrita. Los saltos de línea se respetan.
              </p>
            </div>

            {placeholders.length > 0 && (
              <div>
                <p className="block text-sm font-medium text-secondary-700 mb-1">Variables disponibles</p>
                <div className="flex flex-wrap gap-1.5">
                  {placeholders.map((p) => (
                    <code key={p.key} className="text-xs bg-secondary-100 text-secondary-600 px-2 py-1 rounded" title={p.label}>
                      {`{{${p.key}}}`}
                    </code>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Toggle
                checked={autoSend}
                onChange={(value) => { setAutoSend(value); setPreview(''); }}
                label="Envío automático"
              />
              <div>
                <p className="text-sm font-medium text-secondary-900">Envío automático</p>
                <p className="text-xs text-secondary-500">
                  Notifica al cliente cada vez que la orden entra a «{editing.label}»
                </p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-secondary-700">Vista previa (datos de ejemplo)</p>
                <Button
                  variant="ghost"
                  size="sm"
                  loading={previewMutation.isPending}
                  onClick={() => previewMutation.mutate({ status: editing.status, body })}
                >
                  <Eye className="w-4 h-4" /> Generar
                </Button>
              </div>
              {preview ? (
                <pre className="whitespace-pre-wrap break-words text-sm bg-secondary-50 border border-secondary-200 rounded-lg p-3 text-secondary-800">
                  {preview}
                </pre>
              ) : (
                <p className="text-sm text-secondary-400 bg-secondary-50 border border-dashed border-secondary-200 rounded-lg p-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Pulsa «Generar» para ver el mensaje con datos de ejemplo.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>Cancelar</Button>
              <Button
                onClick={() => saveMutation.mutate({ status: editing.status, body, autoSend })}
                loading={saveMutation.isPending}
                disabled={!body.trim()}
              >
                <Save className="w-4 h-4" /> Guardar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
