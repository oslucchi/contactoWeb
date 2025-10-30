import Vue from 'vue';
import VueRouter from 'vue-router';

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
  { path: '/', name: 'Home', component: DashboardByProject, meta: { titleKey: 'navigation.dashboardByProject' } },
  { path: '/persons', component: PersonsList, meta: { titleKey: 'navigation.persons' } },
  { path: '/persons/new', component: PersonsForm, meta: { titleKey: 'navigation.newPerson' } },
  { path: '/persons/:id', component: PersonsForm, props: true, meta: { titleKey: 'navigation.editPerson' } },

  { path: '/companies', component: CompaniesList, meta: { titleKey: 'navigation.companies' } },
  { path: '/companies/new', component: CompaniesForm, meta: { titleKey: 'navigation.newCompany' } },
  { path: '/companies/:id', component: CompaniesForm, props: true, meta: { titleKey: 'navigation.editCompany' } },

  { path: '/branches', component: BranchesList, meta: { titleKey: 'navigation.branches' } },
  { path: '/branches/new', component: BranchesForm, meta: { titleKey: 'navigation.newBranch' } },
  { path: '/branches/:id', component: BranchesForm, props: true, meta: { titleKey: 'navigation.editBranch' } },

  { path: '/organization', component: OrganizationList, meta: { titleKey: 'navigation.organization' } },
  { path: '/organization/new', component: OrganizationForm, meta: { titleKey: 'navigation.newOrganization' } },
  { path: '/organization/:id', component: OrganizationForm, props: true, meta: { titleKey: 'navigation.editOrganization' } },

  { path: '/employees', component: EmployeesList, meta: { titleKey: 'navigation.employees' } },
  { path: '/employees/new', component: EmployeesForm, meta: { titleKey: 'navigation.newEmployee' } },
  { path: '/employees/:id', component: EmployeesForm, props: true, meta: { titleKey: 'navigation.editEmployee' } },

  { path: '/projects', component: ProjectsList, meta: { titleKey: 'navigation.projects' } },
  { path: '/projects/new', component: ProjectsForm, meta: { titleKey: 'navigation.newProject' } },
  { path: '/projects/:id', component: ProjectsForm, props: true, meta: { titleKey: 'navigation.editProject' } },

  { path: '/dashboardByCompany', component: DashboardByCompany, meta: { titleKey: 'navigation.dashboardByCompany' } },
  { path: '/dashboardByProject', component: DashboardByProject, meta: { titleKey: 'navigation.dashboardByProject' } },
  { path: '/masterDataDashboard', component: DashboardMasterData, meta: { titleKey: 'navigation.dashboardMasterData' } },

  { path: '/agenda/schedule', component: AgendaCalendar, props: true, meta: { titleKey: 'navigation.agenda' } },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;