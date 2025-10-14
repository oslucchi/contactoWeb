import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';

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
import DashboardByCompany from '../views/Utils/DashboardByCompany.vue';

Vue.use(VueRouter);

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/persons', component: PersonsList },
  { path: '/persons/new', component: PersonsForm },
  { path: '/persons/:id', component: PersonsForm, props: true },

  { path: '/companies', component: CompaniesList },
  { path: '/companies/new', component: CompaniesForm },
  { path: '/companies/:id', component: CompaniesForm, props: true },

  { path: '/branches', component: BranchesList },
  { path: '/branches/new', component: BranchesForm },
  { path: '/branches/:id', component: BranchesForm, props: true },

  { path: '/organization', component: OrganizationList },
  { path: '/organization/new', component: OrganizationForm },
  { path: '/organization/:id', component: OrganizationForm, props: true },

  { path: '/employees', component: EmployeesList },
  { path: '/employees/new', component: EmployeesForm },
  { path: '/employees/:id', component: EmployeesForm, props: true },

  { path: '/projects', component: ProjectsList },
  { path: '/projects/new', component: ProjectsForm },
  { path: '/projects/:id', component: ProjectsForm, props: true },

  { path: '/dashboardByCompany', component: DashboardByCompany },

  { path: '/agenda/schedule', component: AgendaCalendar, props: true },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;