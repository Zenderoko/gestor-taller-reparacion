import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { whatsappApi } from '@/lib/api';
import { MessageCircle, RefreshCw, CheckCircle, XCircle, Loader } from 'lucide-react';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

const STATUS_MAP = {
  connected: { label: 'Conectado', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  qr: { label: 'Esperando QR', icon: Loader, color: 'text-yellow-600', bg: 'bg-yellow-50' },
  disconnected: { label: 'Desconectado', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

export default function WhatsAppSettings() {
  const [qrImage, setQrImage] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['whatsapp-status'],
    queryFn: () => whatsappApi.getStatus(),
    refetchInterval: 3000,
  });

  const status = data?.data;
  const currentStatus = STATUS_MAP[status?.status] || STATUS_MAP.disconnected;
  const StatusIcon = currentStatus.icon;

  useEffect(() => {
    if (status?.qr && status.qr !== qrImage) {
      setQrImage(status.qr);
    }
    if (status?.status === 'connected') {
      setQrImage(null);
    }
  }, [status?.qr, status?.status]);

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center py-20">
        <Loader className="w-6 h-6 animate-spin text-secondary-400" />
      </div>
    );
  }

  return (
    <div className="page-container max-w-lg">
      <div className="page-header">
        <div>
          <h1 className="page-title">WhatsApp</h1>
          <p className="page-subtitle">Conecta tu WhatsApp para enviar notificaciones</p>
        </div>
      </div>

      <div className={`card ${currentStatus.bg}`}>
        <div className="card-body flex items-center gap-3">
          <StatusIcon className={`w-8 h-8 ${currentStatus.color} ${status?.status === 'qr' ? 'animate-spin' : ''}`} />
          <div>
            <p className={`font-semibold ${currentStatus.color}`}>{currentStatus.label}</p>
            <p className="text-sm text-secondary-500">
              {status?.status === 'connected'
                ? 'Puedes enviar notificaciones a tus clientes'
                : status?.status === 'qr'
                  ? 'Escanea el código QR con tu WhatsApp'
                  : 'Conecta tu WhatsApp para empezar'}
            </p>
          </div>
        </div>
      </div>

      {status?.status === 'qr' && qrImage && (
        <div className="card mt-4">
          <div className="card-body flex flex-col items-center gap-4">
            <p className="text-sm text-secondary-600 text-center">
              Abre WhatsApp en tu teléfono, ve a <strong>Menú → WhatsApp Web</strong> y escanea este código:
            </p>
            <img src={qrImage} alt="Código QR" className="w-48 h-48 sm:w-64 sm:h-64 border border-secondary-200 rounded-lg" />
            <p className="text-xs text-secondary-400">El código se actualiza automáticamente si expira</p>
          </div>
        </div>
      )}

      {status?.status === 'disconnected' && (
        <div className="mt-4">
          <Button className="w-full" onClick={async () => {
            try {
              await whatsappApi.connect();
              toast.success('Conectando WhatsApp...');
              refetch();
            } catch (err) {
              toast.error(err.message);
            }
          }}>
            <MessageCircle className="w-4 h-4" /> Conectar WhatsApp
          </Button>
        </div>
      )}

      {status?.status === 'connected' && (
        <div className="mt-4">
          <Button variant="secondary" className="w-full" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" /> Verificar estado
          </Button>
        </div>
      )}
    </div>
  );
}
