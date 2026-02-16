import React, { useState } from 'react';
import FloatingNav from './components/navigation/FloatingNav';
import VaultOrganizer from './components/navigation/VaultOrganizer';
import SemanticSearchOverlay from './components/search/SemanticSearchOverlay';

export default function Layout({ children, currentPageName }) {
    const [showSearch, setShowSearch] = useState(false);

    return (
        <div className="min-h-screen bg-[#0C100E] text-[#F5F0EA]">
            <style>{`
        :root {
          --obsidian: #0C100E;
          --teal: #364442;
          --sandstone: #C2AD90;
          --amber: #97754D;
          --ember: #5D4429;
          --cream: #F5F0EA;
        }
      `}</style>
            {/* <VaultOrganizer /> */}
            {children}
            <FloatingNav currentPage={currentPageName} onSearchClick={() => setShowSearch(true)} />
            <SemanticSearchOverlay isOpen={showSearch} onClose={() => setShowSearch(false)} />
        </div>
    );
}