import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  ClipboardCheck, 
  TrendingUp,
  Download
} from 'lucide-react';
import clsx from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workout Plan', href: '/plan', icon: Calendar },
  { name: 'Log Workout', href: '/log', icon: ClipboardCheck },
  { name: 'Progress', href: '/progress', icon: TrendingUp },
];

const Sidebar = () => {
  const location = useLocation();

  return (
    <div className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg border-r border-gray-200 pt-16">
      <div className="flex flex-col h-full">
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={clsx(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-4 text-white">
            <div className="flex items-center space-x-2 mb-2">
              <Download className="h-5 w-5" />
              <span className="font-medium">Export Calendar</span>
            </div>
            <p className="text-xs text-primary-100 mb-3">
              Download your workout plan to add to your calendar app
            </p>
            <button className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm py-2 px-3 rounded-md transition-colors">
              Download ICS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
