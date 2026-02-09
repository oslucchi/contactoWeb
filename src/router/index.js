import Vue from 'vue';
import VueRouter from 'vue-router';
import store from '@/store';

import Login from '../views/Login.vue';
import PersonsForm from '../views/MasterDataHandlers/Persons/PersonsForm.vue';
import PersonsList from '../views/MasterDataHandlers/Persons/PersonsList.vue';
import CompaniesForm from '../views/MasterDataHandlers/Companies/CompaniesForm.vue';
import CompaniesList from '../views/MasterDataHandlers/Companies/CompaniesList.vue';
import BranchesForm from '../views/MasterDataHandlers/Branches/BranchesForm.vue';
import BranchesList from '../views/MasterDataHandlers/Branches/BranchesList.vue';
import OrganizationForm from '../views/MasterDataHandlers/Organization/OrganizationForm.vue';
import OrganizationList from '../views/MasterDataHandlers/Organization/OrganizationList.vue';
import EmployeesForm from '../views/MasterDataHandlers/Employees/EmployeesForm.vue';
import EmployeesList from '../views/MasterDataHandlers/Employees/EmployeesList.vue';
import AgendaCalendar from '@/views/Agenda/AgendaCalendar.vue';
import ProjectsList from '@/views/MasterDataHandlers/Projects/ProjectsList.vue';
import ProjectsForm from '@/views/MasterDataHandlers/Projects/ProjectsForm.vue';
import DashboardByCompany from '../views/Dashboards/DashboardByCompany.vue';
import DashboardMasterData from '../views/Dashboards/DashboardMasterData.vue';
import DashboardByProject from '../views/Dashboards/DashboardByProject.vue';

Vue.use(VueRouter);

const routes = [
  { 
    path: '/login', 
    name: 'Login', 
    component: Login, 
    meta: { requiresAuth: false, titleKey: 'navigation.login' } 
  },
  { 
    path: '/', 
    name: 'Home', 
    component: DashboardByProject, 
    meta: { requiresAuth: true, titleKey: 'navigation.dashboardByProject' } 
  },

  { path: '/persons', name: 'MasterPersons', component: PersonsList, meta: { requiresAuth: true, titleKey: 'navigation.persons' } },
  { path: '/persons/new', component: PersonsForm, meta: { requiresAuth: true, titleKey: 'navigation.newPerson' } },
  { path: '/persons/:id', component: PersonsForm, props: true, meta: { requiresAuth: true, titleKey: 'navigation.editPerson' } },

  { path: '/companies', name: 'MasterCompany', component: CompaniesList, meta: { requiresAuth: true, titleKey: 'navigation.companies' } },
  { path: '/companies/new', component: CompaniesForm, meta: { requiresAuth: true, titleKey: 'navigation.newCompany' } },
  { path: '/companies/:id', component: CompaniesForm, props: true, meta: { requiresAuth: true, titleKey: 'navigation.editCompany' } },

  { path: '/branches', component: BranchesList, meta: { requiresAuth: true, titleKey: 'navigation.branches' } },
  { path: '/branches/new', component: BranchesForm, meta: { requiresAuth: true, titleKey: 'navigation.newBranch' } },
  { path: '/branches/:id', component: BranchesForm, props: true, meta: { requiresAuth: true, titleKey: 'navigation.editBranch' } },

  { path: '/organization', component: OrganizationList, meta: { requiresAuth: true, titleKey: 'navigation.organization' } },
  { path: '/organization/new', component: OrganizationForm, meta: { requiresAuth: true, titleKey: 'navigation.newOrganization' } },
  { path: '/organization/:id', component: OrganizationForm, props: true, meta: { requiresAuth: true, titleKey: 'navigation.editOrganization' } },

  { path: '/employees', name: 'MasterEmployees', component: EmployeesList, meta: { requiresAuth: true, titleKey: 'navigation.employees' } },
  { path: '/employees/new', component: EmployeesForm, meta: { requiresAuth: true, titleKey: 'navigation.newEmployee' } },
  { path: '/employees/:id', component: EmployeesForm, props: true, meta: { requiresAuth: true, titleKey: 'navigation.editEmployee' } },

  { path: '/projects', name: 'MasterProjects', component: ProjectsList, meta: { requiresAuth: true, titleKey: 'navigation.projects' } },
  { path: '/projects/new', component: ProjectsForm, meta: { requiresAuth: true, titleKey: 'navigation.newProject' } },
  { path: '/projects/:id', component: ProjectsForm, props: true, meta: { requiresAuth: true, titleKey: 'navigation.editProject' } },

  { path: '/dashboardByCompany', name: 'DashboardByCompany', component: DashboardByCompany, meta: { requiresAuth: true, titleKey: 'navigation.dashboardByCompany' } },
  { path: '/dashboardByProject', name: 'DashboardByProject', component: DashboardByProject, meta: { requiresAuth: true, titleKey: 'navigation.dashboardByProject' } },
  { path: '/masterDataDashboard', name: 'DashboardMasterData', component: DashboardMasterData, meta: { requiresAuth: true, titleKey: 'navigation.dashboardMasterData' } },

  { path: '/agenda/schedule', name: 'MasterEvents', component: AgendaCalendar, props: true, meta: { requiresAuth: true, titleKey: 'navigation.agenda' } },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

/**
 * Navigation Guard - Authentication Check
 */
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false);
  const isAuthenticated = store.getters['auth/isAuthenticated'];
  
  // Try to restore session from localStorage if not authenticated
  if (!isAuthenticated) {
    await store.dispatch('auth/restoreSession');
  }
  
  const isAuthenticatedAfterRestore = store.getters['auth/isAuthenticated'];
  
  if (requiresAuth && !isAuthenticatedAfterRestore) {
    // Redirect to login, save intended destination
    next({
      name: 'Login',
      query: { redirect: to.fullPath }
    });
  } else if (to.name === 'Login' && isAuthenticatedAfterRestore) {
    // Already logged in, redirect to home
    next({ name: 'Home' });
  } else {
    next();
  }
});

export default router;