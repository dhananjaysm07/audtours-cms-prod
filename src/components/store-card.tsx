import { Store } from '@/types';
import { Edit, Power, ExternalLink, Clock } from 'lucide-react';
import { Link } from 'react-router';

interface StoreCardProps {
  store: Store;
  onEdit: (id: number) => void;
  onToggleActivation: (id: number, isActive: boolean) => void;
}

export function StoreCard({
  store,
  onEdit,
  onToggleActivation,
}: StoreCardProps) {
  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100">
      <div className="relative h-44 overflow-hidden">
        <img
          src={
            store.banner ||
            'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=60'
          }
          alt={store.heading}
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onEdit(store.id)}
            className="p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors duration-200"
            title="Edit store"
          >
            <Edit className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={() => onToggleActivation(store.id, store.isActive)}
            className={`p-2 backdrop-blur-sm rounded-full shadow-lg transition-colors duration-200 ${
              store.isActive
                ? 'bg-green-500/95 hover:bg-green-500'
                : 'bg-gray-500/95 hover:bg-gray-500'
            }`}
            title={store.isActive ? 'Deactivate store' : 'Activate store'}
          >
            <Power className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="absolute bottom-3 left-3">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              store.isActive
                ? 'bg-green-500/20 text-green-100 backdrop-blur-sm'
                : 'bg-gray-500/20 text-gray-100 backdrop-blur-sm'
            }`}
          >
            {store.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-1.5 group-hover:text-blue-600 transition-colors duration-200">
          {store.heading}
        </h3>

        <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
          {store.description}
        </p>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">
              {new Date(store.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
          <Link to={`/store/${store.id}`}>
            <button className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors px-2.5 py-1 rounded-lg hover:bg-blue-50/50">
              <span className="text-xs font-medium">View Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
