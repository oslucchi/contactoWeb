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
  { path: '/', name: 'Home', component: DashboardByCompany, meta: { title: 'Vista per azienda' } },
  { path: '/persons', component: PersonsList, meta: { title: 'Anagrafica contatti' } },
  { path: '/persons/new', component: PersonsForm, meta: { title: 'Nuovo contatto' } },
  { path: '/persons/:id', component: PersonsForm, props: true, meta: { title: 'Modifica contatto' } },

  { path: '/companies', component: CompaniesList, meta: { title: 'Anagrafica aziende' } },
  { path: '/companies/new', component: CompaniesForm, meta: { title: 'Nuova azienda' } },
  { path: '/companies/:id', component: CompaniesForm, props: true, meta: { title: 'Modifica azienda' } },

  { path: '/branches', component: BranchesList, meta: { title: 'Anagrafica filiali' } },
  { path: '/branches/new', component: BranchesForm, meta: { title: 'Nuova filiale' } },
  { path: '/branches/:id', component: BranchesForm, props: true, meta: { title: 'Modifica filiale' } },

  { path: '/organization', component: OrganizationList, meta: { title: 'Anagrafica organizzazione' } },
  { path: '/organization/new', component: OrganizationForm, meta: { title: 'Nuova organizzazione' } },
  { path: '/organization/:id', component: OrganizationForm, props: true, meta: { title: 'Modifica organizzazione' } },

  { path: '/employees', component: EmployeesList, meta: { title: 'Anagrafica impiegati' } },
  { path: '/employees/new', component: EmployeesForm, meta: { title: 'Nuovo impiegato' } },
  { path: '/employees/:id', component: EmployeesForm, props: true, meta: { title: 'Modifica impiegato' } },

  { path: '/projects', component: ProjectsList, meta: { title: 'Anagrafica progetti' } },
  { path: '/projects/new', component: ProjectsForm, meta: { title: 'Nuovo progetto' } },
  { path: '/projects/:id', component: ProjectsForm, props: true, meta: { title: 'Modifica progetto' } },

  { path: '/dashboardByCompany', component: DashboardByCompany, meta: { title: 'Vista per azienda' } },

  { path: '/agenda/schedule', component: AgendaCalendar, props: true, meta: { title: 'Agenda' } },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;