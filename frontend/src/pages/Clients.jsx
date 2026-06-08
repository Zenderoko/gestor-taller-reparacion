import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { clientsApi } from '@/lib/api';
import { formatDate, formatPhone } from '@/lib/utils';
import { Plus, Users, Phone, Mail, ChevronRight, Archive } from 'lucide-react';
import Button from '@/components/ui/Button';
import SearchInput from '@/components/shared/SearchInput';
import Loader from '@/components/shared/Loader';
import EmptyState from '@/components/ui/EmptyState';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

export default function Clients() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, showArchived, page],
    queryFn: () => clientsApi.list({ search, showArchived: showArchived || undefined, page, limit: 20 }),
  });

  const onSubmit = async (formData) => {
    try {
      const res = await clientsApi.create(formData);
      toast.success('Cliente creado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setModalOpen(false);
      reset();
      navigate(`/clients/${res.data.id}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Gestiona tus clientes y su historial</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Nuevo cliente
        </Button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-secondary-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Buscar por nombre, teléfono o email..."
            />
          </div>
          <div className="flex items-center">
            <button
              onClick={() => { setShowArchived(!showArchived); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-colors ${showArchived ? 'bg-primary-50 border-primary-300 text-primary-700' : 'border-secondary-300 text-secondary-600 hover:bg-secondary-50'}`}
            >
              <Archive className="w-4 h-4" /> Archivados
            </button>
          </div>
        </div>

        {isLoading ? (
          <Loader />
        ) : data?.data?.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No hay clientes"
            description="Crea tu primer cliente para comenzar"
            action={<Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4" /> Nuevo cliente</Button>}
          />
        ) : (
          <>
            <Table>
              <Thead>
                  <Tr>
                    <Th>Nombre</Th>
                    <Th>Teléfono</Th>
                    <Th className="hidden sm:table-cell">Email</Th>
                    <Th className="hidden md:table-cell">Equipos</Th>
                    <Th className="hidden md:table-cell">Órdenes</Th>
                    <Th className="hidden md:table-cell">Registrado</Th>
                    <Th className="hidden sm:table-cell"></Th>
                  </Tr>
              </Thead>
              <Tbody>
                {data?.data?.map((client) => (
                  <Tr key={client.id} onClick={() => navigate(`/clients/${client.id}`)}>
                    <Td className="font-medium text-secondary-900">{client.name}</Td>
                    <Td>
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-secondary-400" />
                        {formatPhone(client.phone)}
                      </span>
                    </Td>
                    <Td className="hidden sm:table-cell">
                      {client.email && (
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-secondary-400" />
                          {client.email}
                        </span>
                      )}
                    </Td>
                    <Td className="hidden md:table-cell">{client._count?.equipments || 0}</Td>
                    <Td className="hidden md:table-cell">{client._count?.orders || 0}</Td>
                    <Td className="hidden md:table-cell text-secondary-500">{formatDate(client.createdAt)}</Td>
                    <Td className="hidden sm:table-cell"><ChevronRight className="w-4 h-4 text-secondary-400" /></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <Pagination
              page={page}
              totalPages={data?.totalPages || 1}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); reset(); }} title="Nuevo cliente">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre" required {...register('name', { required: 'El nombre es requerido' })} error={errors.name?.message} />
          <Input label="Teléfono" required {...register('phone', { required: 'El teléfono es requerido' })} error={errors.phone?.message} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="DNI / Documento" {...register('documentId')} />
          <Input label="Dirección" {...register('address')} />
          <Input label="Notas" {...register('notes')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); reset(); }}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
