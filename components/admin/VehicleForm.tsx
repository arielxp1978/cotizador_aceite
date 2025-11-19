
import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { getVehicleById, createVehicle, updateVehicle } from '../../services/adminService';
import { VehiculoServicio, Producto } from '../../types';
import { LoadingSpinner, SaveIcon, ArrowLeftIcon, PlusIcon, DeleteIcon } from '../IconComponents';
import ProductSelectorModal from './ProductSelectorModal';

type FormValues = Omit<VehiculoServicio, 'cod_vehiculo'>;

const VehicleForm: React.FC<{ vehicleId?: number; allProducts: Producto[] }> = ({ vehicleId, allProducts }) => {
    const { register, handleSubmit, control, reset, setValue, getValues, formState: { errors } } = useForm<FormValues>();
    
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState<{ field: keyof FormValues; title: string; defaultSearchTerm?: string; } | null>(null);

    const isEditing = vehicleId !== undefined;

    const loadVehicleData = useCallback(async () => {
        if (isEditing) {
            setLoading(true);
            setError(null);
            try {
                const data = await getVehicleById(vehicleId!);
                if (data) {
                    reset(data);
                }
            } catch (err: any) {
                setError(`Error cargando vehículo: ${err.message}`);
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, [isEditing, vehicleId, reset]);

    useEffect(() => {
        loadVehicleData();
    }, [loadVehicleData]);

    const onSubmit = async (data: FormValues) => {
        setSaving(true);
        setError(null);

        try {
            if (isEditing) {
                await updateVehicle(vehicleId!, data);
                alert('Vehículo actualizado con éxito.');
            } else {
                await createVehicle(data);
                alert('Vehículo creado con éxito.');
            }
            window.location.hash = '#/admin';
        } catch (err: any) {
            setError(`Error al guardar: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleOpenModal = (field: keyof FormValues, title: string) => {
        const currentValues = getValues();
        let defaultSearchTerm = '';
        if (field === 'aceite_motor_cod') {
            defaultSearchTerm = currentValues.nomenclatura_aceite || '';
        }
        setModalConfig({ field, title, defaultSearchTerm });
        setIsModalOpen(true);
    };

    const handleProductSelect = (selectedCodes: string[]) => {
        if (modalConfig) {
            setValue(modalConfig.field, selectedCodes, { shouldValidate: true, shouldDirty: true });
        }
        setIsModalOpen(false);
    };

    if (loading) return <div className="flex justify-center p-8"><LoadingSpinner className="w-10 h-10" /></div>;
    if (error && isEditing) return <div className="text-center text-red-400 bg-red-900/20 p-4 rounded-lg">{error}</div>;

    const renderRepuestoField = (field: keyof FormValues, title: string) => (
        <Controller
            name={field}
            control={control}
            defaultValue={null}
            render={({ field: { value: codes, onChange } }) => (
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{title}</label>
                    <div className="bg-gray-900 border-2 border-gray-700 rounded-lg p-2 min-h-[80px]">
                        {codes && codes.length > 0 ? (
                            <ul className="space-y-1">
                                {codes.map((code, index) => {
                                    const product = allProducts.find(p => p.codigo === code);
                                    return (
                                        <li key={`${code}-${index}`} className="flex items-center justify-between bg-gray-800 p-2 rounded">
                                            <div className="text-sm">
                                                <p className="font-semibold text-white">{product?.marca || 'Marca desc.'} <span className="text-xs text-gray-500 font-normal">({product?.proveedor || 'Sin prov.'})</span></p>
                                                <p className="text-gray-400">{product?.descripcion || 'Descripción desconocida'}</p>
                                                <p className="font-mono text-xs text-gray-500">{code}</p>
                                            </div>
                                            <button type="button" onClick={() => onChange(codes.filter(c => c !== code))} className="p-1 text-red-500 hover:text-red-400">
                                                <DeleteIcon className="w-4 h-4" />
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p className="text-gray-500 text-sm p-2">No hay repuestos asignados.</p>
                        )}
                    </div>
                    <button type="button" onClick={() => handleOpenModal(field, title)} className="mt-2 flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 font-semibold">
                        <PlusIcon className="w-4 h-4" />
                        Añadir/Editar Repuesto
                    </button>
                </div>
            )}
        />
    );
    
    const renderObservacionesField = () => (
        <div>
            <label htmlFor="observaciones" className="block text-sm font-medium text-gray-300 mb-1">Observaciones (Extras)</label>
            <textarea
                id="observaciones"
                {...register('observaciones')}
                rows={3}
                className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            ></textarea>
        </div>
    );
    
    const renderTextField = (name: keyof FormValues, label: string, required = false) => (
        <div>
           <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
           <input
               type="text"
               id={name}
               {...register(name, { required })}
               className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
           />
           {errors[name] && <span className="text-red-400 text-xs">Este campo es requerido.</span>}
       </div>
   );
   
   const renderNumberField = (name: keyof FormValues, label: string, required = false, step = "0.01") => (
        <div>
           <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
           <input
               type="number"
               id={name}
               step={step}
               {...register(name, { required, valueAsNumber: true })}
               className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg text-white p-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
           />
            {errors[name] && <span className="text-red-400 text-xs">Este campo es requerido.</span>}
       </div>
   );

    return (
        <>
            {isModalOpen && modalConfig && (
                <ProductSelectorModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSelect={handleProductSelect}
                    title={modalConfig.title}
                    // @ts-ignore
                    initialSelectedCodes={control._getWatch(modalConfig.field) || []}
                    allProducts={allProducts}
                    defaultSearchTerm={modalConfig.defaultSearchTerm}
                />
            )}
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-4xl mx-auto">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">{isEditing ? `Editando Vehículo #${vehicleId}` : 'Nuevo Vehículo'}</h2>
                     <button onClick={() => window.location.hash = '#/admin'} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-semibold">
                        <ArrowLeftIcon className="w-5 h-5" />
                        Volver a la lista
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <legend className="text-lg font-semibold text-indigo-300 col-span-full mb-2 border-b border-gray-700 pb-2">Información del Vehículo</legend>
                        {renderTextField('marca', 'Marca', true)}
                        {renderTextField('modelo', 'Modelo', true)}
                        {renderTextField('version', 'Versión')}
                        {renderNumberField('ano', 'Año', false, "1")}
                        {renderTextField('motor_cil', 'Motor / Cilindrada')}
                        {renderTextField('motor_cod', 'Código de Motor')}
                    </fieldset>
                    
                    <fieldset className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <legend className="text-lg font-semibold text-indigo-300 col-span-full mb-2 border-b border-gray-700 pb-2">Servicio de Aceite</legend>
                        {renderTextField('tipo_aceite', 'Tipo de Aceite')}
                        {renderTextField('nomenclatura_aceite', 'Viscosidad')}
                        {renderNumberField('litros_aceite', 'Litros de Aceite')}
                        {renderTextField('intervalo_cambio', 'Intervalo de Cambio')}
                        {renderNumberField('tiempo_mano_obra_minutos', 'Tiempo Mano de Obra (min)', false, "1")}
                    </fieldset>
                     <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                         <legend className="text-lg font-semibold text-indigo-300 col-span-full mb-2 border-b border-gray-700 pb-2">Repuestos: Servicio de Aceite</legend>
                         {renderRepuestoField('aceite_motor_cod', 'Aceite de Motor')}
                         {renderRepuestoField('filtro_aceite_cod', 'Filtro de Aceite')}
                         {renderRepuestoField('filtro_aire_cod', 'Filtro de Aire')}
                         {renderRepuestoField('filtro_combustible_cod', 'Filtro de Combustible')}
                         {renderRepuestoField('filtro_habitaculo_cod', 'Filtro de Habitáculo')}
                    </fieldset>

                     <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                         <legend className="text-lg font-semibold text-indigo-300 col-span-full mb-2 border-b border-gray-700 pb-2">Repuestos: Servicio de Correa</legend>
                         {renderRepuestoField('correa_distribucion_cod', 'Kit Distribución')}
                         {renderRepuestoField('tensor_distribucion_cod', 'Tensor de Distribución')}
                         {renderRepuestoField('rodillos_cod', 'Rodillos')}
                         {renderRepuestoField('bomba_agua_cod', 'Bomba de Agua')}
                         <div className="md:col-span-2">
                            {renderNumberField('tiempo_mano_obra_correa_minutos', 'Tiempo Mano de Obra Correa (min)', false, "1")}
                         </div>
                    </fieldset>
                    
                     <fieldset className="grid grid-cols-1 gap-6">
                         <legend className="text-lg font-semibold text-indigo-300 col-span-full mb-2 border-b border-gray-700 pb-2">Kits y Combos</legend>
                         {renderRepuestoField('combos_cod', 'Kits / Combos Recomendados')}
                         <p className="text-sm text-gray-500 italic -mt-4">Busca por "Rubro: Aceite, Subrubro: Combo" o por "KIT" en la descripción.</p>
                    </fieldset>

                    <fieldset>
                        <legend className="text-lg font-semibold text-indigo-300 col-span-full mb-2 border-b border-gray-700 pb-2">Notas Adicionales</legend>
                        {renderObservacionesField()}
                    </fieldset>

                    {error && <p className="text-red-400 bg-red-900/20 p-3 rounded-lg text-center">{error}</p>}

                    <div className="flex justify-end pt-4">
                        <button type="submit" disabled={saving} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-lg transition disabled:opacity-50">
                            {saving ? <LoadingSpinner className="w-5 h-5" /> : <SaveIcon className="w-5 h-5" />}
                            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default VehicleForm;
