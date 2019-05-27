import axios from 'axios'

const path = '/api/project'

export async function get(id) {
  return axios.get(`${path}/${id}`)
}
export async function put(project) {
  return axios.put(`${path}/${project._id}`, project)
}
export async function post() {
  return axios.post(`${path}/`)
}
export async function remove(id) {
  return axios.delete(`${path}/${id}`)
}

export async function getAll() {
  return axios.get(`${path}/all`)
}
