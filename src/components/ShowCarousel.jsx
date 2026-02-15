import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const ShowCarousel = ({ title, shows, to }) => {
    return (
        <section className="py-6">
            <div className="flex justify-between items-end px-6 mb-4">
                <h2 className="text-2xl font-bold tracking-tight text-white">{title}</h2>
                {to && (
                    <Link to={to} className="text-zinc-400 text-sm font-bold hover:underline">
                        Show all
                    </Link>
                )}
            </div>

            {/* The Spotify-style Horizontal Scroll */}
            <div className="flex space-x-6 overflow-x-auto px-6 pb-4 scrollbar-hide snap-x">
                {shows.map((show) => (
                    <Link to={`/podcast/${show.id}`} key={show.id} className="flex-shrink-0 w-48 snap-start group cursor-pointer block">
                        <div className="relative aspect-square mb-3 overflow-hidden rounded-lg shadow-lg bg-zinc-800">
                            <img
                                src={show.image_url || show.cover_url || show.cover_image}
                                alt={show.title}
                                className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                            <div className="absolute bottom-2 right-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                <div className="bg-green-500 rounded-full p-3 shadow-xl hover:scale-105 transition-transform">
                                    <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                </div>
                            </div>
                        </div>
                        <h4 className="font-bold text-white text-base truncate pr-1">{show.title}</h4>
                        <p className="text-zinc-400 text-sm mt-1 truncate line-clamp-2">{show.author || show.authorName || (show.podcast && show.podcast.author) || 'Unknown Author'}</p>
                    </Link>
                ))}
            </div>
        </section>
    );
};

export default ShowCarousel;
