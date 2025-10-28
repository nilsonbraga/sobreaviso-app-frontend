import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Users, Calendar, Clock, UserCog, LayoutDashboard, Building, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('on-duty');
  const isAdmin = user?.role === 'admin';

  const tabsAll = [
    { value: 'on-duty',   label: 'Plantão Atual', icon: ShieldCheck, adminOnly: false, enabled: true },
    { value: 'schedules', label: 'Escalas',       icon: Calendar,    adminOnly: false, enabled: true },
    { value: 'people',    label: 'Pessoas',       icon: UserCog,     adminOnly: false, enabled: true },
    { value: 'teams',     label: 'Equipes',       icon: Users,       adminOnly: false, enabled: true },
    { value: 'sectors',   label: 'Serviços',       icon: Building,    adminOnly: true,  enabled: true },
    { value: 'users',     label: 'Usuários',      icon: Users,       adminOnly: true,  enabled: true },
    { value: 'timeslots', label: 'Horários',      icon: Clock,       adminOnly: false, enabled: true },
  ];

  const tabs = useMemo(() => tabsAll.filter(t => t.enabled && (!t.adminOnly || isAdmin)), [isAdmin]);

  useEffect(() => {
    if (!tabs.find(t => t.value === activeTab)) setActiveTab(tabs[0]?.value ?? 'on-duty');
  }, [tabs, activeTab]);

  const handleLogout = () => {
    try { localStorage.removeItem('hospital_user'); } catch {}
    onLogout?.();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'on-duty':   return <OnDutyPreview />;                  
      case 'schedules': return <ScheduleManagement user={user} />; 
      case 'people':    return <PeopleManagement user={user} />;  
      case 'teams':     return <TeamsManagement user={user} />;   
      case 'sectors':   return isAdmin ? <SectorManagement /> : null; 
      case 'users':     return isAdmin ? <UsersManagement /> : null;  
      case 'timeslots': return <TimeSlotManagement user={user} />; 
      default:          return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-sky-50">
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-white/80 backdrop-blur-lg border-b border-blue-100 sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-sky-500 rounded-xl flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                Painel Administrativo
              </h1>
              <p className="text-sm text-gray-600">Olá, {user?.name}</p>
            </div>
          </div>

          <Button onClick={handleLogout} variant="outline" className="gap-2 hover:bg-blue-100 transition-colors">
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 bg-white/50 p-2 rounded-xl shadow-sm">
            {tabs.map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="gap-2 relative data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 transition-all duration-300"
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.value && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5  rounded-full"
                  />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
