import React from 'react';
import { useAuth } from '../../auth/AuthContext';
import LoginPage from './LoginPage';
import VehicleListPage from './VehicleListPage';
import VehicleForm from './VehicleForm';
import AuditLogPage from './AuditLogPage';
import { LogoutIcon, CarIcon, SearchIcon, ArrowLeftIcon } from '../IconComponents';
import { VehiculoServicio, Producto } from '../../types';

interface AdminPageProps {
    route: string;
    vehicles: VehiculoServicio[];
    allProducts: Producto[];
    loading: boolean;
    error: string | null;
    refreshData: () => void;
}

const AdminPage: React.FC<AdminPageProps> = ({ route, vehicles, allProducts, loading, error, refreshData }) => {
    const { user, signOut } = useAuth();
    
    const currentTab = route.startsWith('#/admin/audit') ? 'audit' : 'vehicles';

    if (!user) {
        return <LoginPage />;
    }

    const renderAdminContent = () => {
        if (currentTab === 'audit') {
            return <AuditLogPage />;
        }

        const newVehicleMatch = route.match(/^#\/admin\/vehicles\/new$/);
        if (newVehicleMatch) {
            return <VehicleForm allProducts={allProducts} />;
        }
        
        const editVehicleMatch = route.match(/^#\/admin\/vehicles\/edit\/(\d+)$/);
        if (editVehicleMatch) {
            const vehicleId = parseInt(editVehicleMatch[1], 10);
            return <VehicleForm vehicleId={vehicleId} allProducts={allProducts} />;
        }
        
        return <VehicleListPage 
            vehicles={vehicles}
            loading={loading}
            error={error}
            onRefresh={refreshData}
        />;
    };

    return (
        <div className="min-h-screen bg-gray-800 font-sans text-gray-100 flex flex-col">
            <header className="bg-gray-900 sticky top-0 z-40 border-b border-gray-700">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                            </svg>
                            <h1 className="text-xl font-bold text-white tracking-tight">Panel de Administración</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
                            <button onClick={() => window.location.hash = '#/'} className="flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300">
                                <ArrowLeftIcon className="w-4 h-4" />
                                <span>Ir al Cotizador</span>
                            </button>
                            <button onClick={signOut} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition">
                                <LogoutIcon className="w-5 h-5" />
                                <span className="hidden sm:block">Salir</span>
                            </button>
                        </div>
                    </div>
                </div>
                 <div className="bg-gray-900/50 border-t border-gray-700">
                    <div className="container mx-auto px-4">
                        <nav className="flex items-center gap-4">
                            <a href="#/admin" 
                               className={`flex items-center gap-2 py-2 px-3 text-sm font-semibold transition-colors duration-200 ${currentTab === 'vehicles' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}>
                                <CarIcon className="w-5 h-5" />
                                Vehículos
                            </a>
                            <a href="#/admin/audit" 
                               className={`flex items-center gap-2 py-2 px-3 text-sm font-semibold transition-colors duration-200 ${currentTab === 'audit' ? 'text-white border-b-2 border-indigo-500' : 'text-gray-400 hover:text-white'}`}>
                                <SearchIcon className="w-5 h-5" />
                                Auditoría
                            </a>
                        </nav>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8 flex-grow">
                {renderAdminContent()}
            </main>
        </div>
    );
};

export default AdminPage;
