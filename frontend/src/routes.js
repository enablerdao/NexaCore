import Home from './pages/Home';
import WalletPage from './pages/WalletPage';
import Transactions from './pages/Transactions';
import Explorer from './pages/Explorer';
import Send from './pages/Send';
import Staking from './pages/Staking';
import Governance from './pages/Governance';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import DashboardPage from './pages/DashboardPage';
import Nodes from './pages/Nodes';
import Contracts from './pages/Contracts';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';
import History from './pages/History';
import Support from './pages/Support';
import NotFound from './pages/NotFound';

const routes = [
  {
    path: '/',
    component: Home,
    requiresAuth: false,
    exact: true
  },
  {
    path: '/login',
    component: Login,
    requiresAuth: false
  },
  {
    path: '/register',
    component: Register,
    requiresAuth: false
  },
  {
    path: '/wallet',
    component: WalletPage,
    requiresAuth: true
  },
  {
    path: '/transactions',
    component: Transactions,
    requiresAuth: true
  },
  {
    path: '/explorer',
    component: Explorer,
    requiresAuth: false
  },
  {
    path: '/send',
    component: Send,
    requiresAuth: true
  },
  {
    path: '/staking',
    component: Staking,
    requiresAuth: true
  },
  {
    path: '/governance',
    component: Governance,
    requiresAuth: true
  },
  {
    path: '/settings',
    component: Settings,
    requiresAuth: true
  },
  {
    path: '/dashboard',
    component: DashboardPage,
    requiresAuth: true
  },
  {
    path: '/nodes',
    component: Nodes,
    requiresAuth: true
  },
  {
    path: '/contracts',
    component: Contracts,
    requiresAuth: true
  },
  {
    path: '/marketplace',
    component: Marketplace,
    requiresAuth: true
  },
  {
    path: '/profile',
    component: Profile,
    requiresAuth: true
  },
  {
    path: '/history',
    component: History,
    requiresAuth: true
  },
  {
    path: '/support',
    component: Support,
    requiresAuth: false
  },
  {
    path: '/404',
    component: NotFound,
    requiresAuth: false
  }
];

export default routes;