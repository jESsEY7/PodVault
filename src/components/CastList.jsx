import React from 'react';

const CastList = ({ castMembers }) => {
    if (!castMembers || castMembers.length === 0) return null;

    return (
        <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 text-[#F5F0EA]">Cast & Crew</h3>
            <div className="flex space-x-6 overflow-x-auto pb-4 scrollbar-hide">
                {castMembers.map((person) => (
                    <div key={person.id} className="flex-shrink-0 group cursor-pointer">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-transparent group-hover:border-[#a855f7] transition-all bg-[#364442]">
                            <img
                                src={person.image_url || 'https://ui-avatars.com/api/?name=' + person.name}
                                alt={person.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <p className="mt-2 text-sm font-semibold text-center w-24 truncate text-[#F5F0EA]">
                            {person.name}
                        </p>
                        <p className="text-xs text-[#F5F0EA]/60 text-center uppercase tracking-tighter">
                            {person.role}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CastList;
