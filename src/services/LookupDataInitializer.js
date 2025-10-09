import axios from 'axios';
import { API_BASE_URL } from '@/config/apiConfig';
import Company from '../types/Company';

const LookupData = {
  segments: [],
  branchTypes: [],

  async initialize() {
    const [segmentsRes, branchTypesRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/lookupData/segments`),
      axios.get(`${API_BASE_URL}/lookupData/branchTypes`),
    ]);
    this.segments = segmentsRes.data;
    this.branchTypes = branchTypesRes.data;
  }
};

export default LookupData;