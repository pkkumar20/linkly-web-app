import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

export default function Chip({ name, avatar, onRemove }) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full shadow-sm transition group hover:bg-gray-200">
      {/* Avatar Area */}
      <div
        onClick={onRemove}
        className="relative w-8 h-8 cursor-pointer transition-all duration-200"
      >
        {/* Avatar Image */}
        <img
          src={avatar}
          alt={name}
          className="w-8 h-8 rounded-full object-cover absolute top-0 left-0 transition-opacity duration-200 group-hover:opacity-0"
        />
        {/* Red ❌ Icon appears on hover */}
        <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <XMarkIcon className="w-4 h-4" />
        </div>
      </div>

      {/* Name */}
      <span className="text-sm font-medium text-gray-800">{name}</span>
    </div>
  );
}
