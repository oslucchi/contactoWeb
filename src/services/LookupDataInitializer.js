import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import Company from '../types/Company';

const LookupData = {
  companies: [],
  segments: [],
  branchTypes: [],

  async initialize() {
    const [companiesRes, segmentsRes, branchTypesRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/companies/getBySubstring?searchFor=`),
      axios.get(`${API_BASE_URL}/lookupData/segments`),
      axios.get(`${API_BASE_URL}/lookupData/branchTypes`),
    ]);
    this.companies = companiesRes.data.map(c => c instanceof Company ? c : new Company(c));
    this.segments = segmentsRes.data;
    this.branchTypes = branchTypesRes.data;
  }
};

export default LookupData;