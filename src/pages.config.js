/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import CreatorProfile from './pages/CreatorProfile';
import Creators from './pages/Creators';
import EpisodePlayer from './pages/EpisodePlayer';
import Explore from './pages/Explore';
import GroupSession from './pages/GroupSession';
import Home from './pages/Home';
import Library from './pages/Library';
import Playlists from './pages/Playlists';
import PodcastDetail from './pages/PodcastDetail';
import Search from './pages/Search';
import Settings from './pages/Settings';
import SmartPlaylists from './pages/SmartPlaylists';
import PodcastClubs from './pages/PodcastClubs';
import CreatorDashboard from './pages/CreatorDashboard';
import CreatorContent from './pages/CreatorContent';
import CreatorWallet from './pages/CreatorWallet';
import CreatorAnalytics from './pages/CreatorAnalytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CreatorProfile": CreatorProfile,
    "Creators": Creators,
    "EpisodePlayer": EpisodePlayer,
    "Explore": Explore,
    "GroupSession": GroupSession,
    "Home": Home,
    "Library": Library,
    "Playlists": Playlists,
    "PodcastDetail": PodcastDetail,
    "Search": Search,
    "Settings": Settings,
    "SmartPlaylists": SmartPlaylists,
    "PodcastClubs": PodcastClubs,
    "CreatorDashboard": CreatorDashboard,
    "CreatorContent": CreatorContent,
    "CreatorWallet": CreatorWallet,
    "CreatorAnalytics": CreatorAnalytics,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};