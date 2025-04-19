"use client"
export const dynamic = 'force-dynamic';
import { useState } from 'react';
import { Home, DollarSign, MapPin, Zap, Users, BarChart2, Tag, LogOut } from 'lucide-react';
import { nhost } from '@/lib/nhost';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const handleSignOut = async () => {
    try {
      await nhost.auth.signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  // Mock data for the dashboard
  const sessionData = {
    count: 4,
    change: 33.3,
    hours: 24
  };

  const chargerStatus = {
    inUse: 0,
    active: 3,
    inactive: 0,
    inError: 1
  };

  const performanceData = {
    revenue: 0,
    utilization: { value: 'N/A', extra: 0 },
    consumption: 0,
    sessions: 0
  };

  const SidebarItem = ({ icon, label, active, onClick }) => {
    const Icon = icon;
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-teal-700 ${
          active ? 'bg-teal-700' : ''
        }`}
        onClick={onClick}
      >
        <Icon size={20} color="white" />
        <span className="text-white font-medium">{label}</span>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-teal-800 text-white">
        <div className="p-4 flex items-center gap-2 border-b border-teal-700">
          <div className="bg-teal-600 p-2 rounded-full">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" />
            </svg>
          </div>
          <span className="text-xl font-bold">ionage</span>
        </div>

        <div className="p-2">
          <SidebarItem icon={Home} label="Home" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <SidebarItem icon={DollarSign} label="Revenue" active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')} />
          <SidebarItem icon={MapPin} label="Stations" active={activeTab === 'stations'} onClick={() => setActiveTab('stations')} />
          <SidebarItem icon={Zap} label="Sessions" active={activeTab === 'sessions'} onClick={() => setActiveTab('sessions')} />
          <SidebarItem icon={Users} label="Customers" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
          <SidebarItem icon={BarChart2} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <SidebarItem icon={Tag} label="Tags" active={activeTab === 'tags'} onClick={() => setActiveTab('tags')} />
        </div>

        <div className="mt-auto p-4 border-t border-teal-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gray-300 text-teal-800 w-10 h-10 rounded-full flex items-center justify-center font-bold">
              AA
            </div>
            <div>
              <div className="font-bold">AGRIM</div>
              <div className="text-xs text-gray-300">version 0.7.1</div>
            </div>
          </div>
          <button onClick={handleSignOut} className="flex items-center gap-2 text-white bg-red-500 hover:bg-red-600 p-2 rounded-md w-full justify-center">
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-teal-800">Tulsiani Golf View Apartment</h1>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Session Metrics */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-medium mb-2">Session Metrics</h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-3xl font-bold">{sessionData.count}</span>
                <span className="text-gray-500">sessions in the past {sessionData.hours} hours</span>
                <span className="text-green-500 flex items-center ml-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M7 14L12 9L17 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {sessionData.change}%
                </span>
              </div>
              <div className="h-48 bg-gray-50 rounded border">
                {/* Bar Chart Placeholder */}
                <div className="h-full w-full flex items-end justify-around p-4">
                  <div className="bg-teal-600 w-6 h-10"></div>
                  <div className="bg-teal-600 w-6 h-20"></div>
                  <div className="bg-teal-600 w-6 h-8"></div>
                  <div className="bg-teal-600 w-6 h-36"></div>
                  <div className="bg-teal-600 w-6 h-4"></div>
                  <div className="bg-teal-600 w-6 h-0"></div>
                  <div className="bg-teal-600 w-6 h-0"></div>
                  <div className="bg-teal-600 w-6 h-0"></div>
                </div>
              </div>
            </div>

            {/* Charger Status */}
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-medium mb-2">Charger Status</h2>
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-blue-50 p-3 rounded">
                  <div className="text-blue-500 mb-1">In Use</div>
                  <div className="flex items-center">
                    <Zap className="text-blue-500 mr-1" />
                    <span className="text-2xl font-bold">{chargerStatus.inUse}</span>
                  </div>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <div className="text-green-500 mb-1">Active</div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-1" viewBox="0 0 24 24" fill="none">
                      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
                    </svg>
                    <span className="text-2xl font-bold">{chargerStatus.active}</span>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-gray-500 mb-1">Inactive</div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-1" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span className="text-2xl font-bold">{chargerStatus.inactive}</span>
                  </div>
                </div>
                <div className="bg-red-50 p-3 rounded">
                  <div className="text-red-500 mb-1">In Error</div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-1" viewBox="0 0 24 24" fill="none">
                      <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-2xl font-bold">{chargerStatus.inError}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex border-b">
                  <div className="px-4 py-2 border-b-2 border-teal-600 font-medium text-teal-600">Revenue</div>
                  <div className="px-4 py-2 text-gray-500">Utilization</div>
                  <div className="px-4 py-2 text-gray-500">Consumption</div>
                  <div className="px-4 py-2 text-gray-500">Sessions</div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-2xl font-bold">₹{performanceData.revenue}</span>
                    </div>
                    <div className="text-red-500 text-sm">
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        -100%
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-2xl font-bold">{performanceData.utilization.value}</span>
                      <span className="text-sm ml-1">{performanceData.utilization.extra}</span>
                    </div>
                    <div className="text-red-500 text-sm">
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        N/A%
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-2xl font-bold">{performanceData.consumption}</span>
                      <span className="text-sm ml-1">kWh</span>
                    </div>
                    <div className="text-red-500 text-sm">
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        -100%
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center">
                      <span className="text-2xl font-bold">{performanceData.sessions}</span>
                    </div>
                    <div className="text-red-500 text-sm">
                      <span className="inline-flex items-center">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        -100%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 h-64 bg-gray-50 rounded border">
                  {/* Line Chart Placeholder */}
                  <div className="h-full w-full p-4 flex items-end relative">
                    <div className="absolute bottom-0 right-0 w-24 h-24 border-b border-teal-600 border-r-0 rounded-bl-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}