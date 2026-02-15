import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderTree, ChevronRight, ChevronDown, Plus, Folder, FileAudio } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { createPageUrl } from '../../utils';
import { Link } from 'react-router-dom';

const mockCollections = [
    {
        id: '1',
        name: 'My Research',
        children: [
            {
                id: '1-1',
                name: 'AI Ethics',
                episodes: [
                    { id: 'ep1', title: 'Episode 4: Bias in ML' },
                    { id: 'ep2', title: 'Episode 7: Privacy Concerns' }
                ]
            },
            {
                id: '1-2',
                name: 'Quantum Computing',
                episodes: [
                    { id: 'ep3', title: 'Episode 2: Qubits Explained' }
                ]
            }
        ]
    },
    {
        id: '2',
        name: 'Business Strategy',
        children: [
            {
                id: '2-1',
                name: 'Venture Capital',
                episodes: [
                    { id: 'ep4', title: 'Episode 12: Term Sheets' },
                    { id: 'ep5', title: 'Episode 15: Portfolio Theory' }
                ]
            }
        ]
    }
];

function FolderNode({ folder, level = 0 }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="select-none">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#364442]/30 transition-colors text-left"
                style={{ paddingLeft: `${level * 16 + 12}px` }}
            >
                {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-[#C2AD90]" />
                ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-[#C2AD90]" />
                )}
                <Folder className="w-4 h-4 text-[#97754D]" />
                <span className="text-sm text-[#F5F0EA] font-medium">{folder.name}</span>
            </button>

            <AnimatePresence>
                {isOpen && folder.episodes && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        {folder.episodes.map((ep) => (
                            <Link
                                key={ep.id}
                                to={createPageUrl(`EpisodePlayer?id=${ep.id}`)}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#C2AD90]/10 transition-colors"
                                style={{ paddingLeft: `${(level + 1) * 16 + 12}px` }}
                            >
                                <FileAudio className="w-3.5 h-3.5 text-[#C2AD90]/50" />
                                <span className="text-xs text-[#F5F0EA]/70">{ep.title}</span>
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function VaultOrganizer() {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <>
            {/* Collapsed state - thin icon strip */}
            <motion.div
                initial={false}
                animate={{ width: isExpanded ? 300 : 48 }}
                className="fixed left-0 top-20 bottom-24 glass-heavy z-40 border-r border-[#364442] overflow-hidden"
            >
                {/* Toggle button */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-12 h-12 flex items-center justify-center hover:bg-[#364442]/30 transition-colors"
                >
                    <FolderTree className="w-5 h-5 text-[#C2AD90]" />
                </button>

                {/* Expanded content */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="p-4 space-y-4"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-[#C2AD90]">Vault Collections</h3>
                                <Button size="icon" variant="ghost" className="w-6 h-6">
                                    <Plus className="w-4 h-4 text-[#C2AD90]" />
                                </Button>
                            </div>

                            <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
                                {mockCollections.map((collection) => (
                                    <div key={collection.id} className="space-y-1">
                                        <FolderNode folder={collection} level={0} />
                                        {collection.children?.map((child) => (
                                            <FolderNode key={child.id} folder={child} level={1} />
                                        ))}
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 border-t border-[#364442]">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full border-[#C2AD90] text-[#C2AD90] hover:bg-[#C2AD90]/10 text-xs"
                                >
                                    <Plus className="w-3 h-3 mr-1.5" />
                                    New Collection
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Spacer when expanded */}
            {isExpanded && <div className="w-[300px]" />}
        </>
    );
}