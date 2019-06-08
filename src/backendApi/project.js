import axios from 'axios'
import { store } from '../index'
const path = '/api/project'

// Delays returning until the application has loaded
// so the appropriate credentials are available
async function getConfigObject() {
  await store.state.userLoaded
  if (store.state && store.state.user && store.state.user.accessToken) {
    return {
      headers: {
        Authorization: `Bearer ${store.state.user.accessToken}`,
      },
    }
  } else {
    return undefined
  }
}

export async function get(id) {
  return axios.get(`${path}/${id}`, await getConfigObject())
}
export async function put(project) {
  await store.loaded
  return axios.put(`${path}/${project._id}`, project, await getConfigObject())
}
export async function post() {
  await store.loaded
  return axios.post(`${path}/`, {}, await getConfigObject())
}
export async function remove(id) {
  await store.loaded
  return axios.delete(`${path}/${id}`, await getConfigObject())
}

export async function getAll() {
  await store.loaded
  return axios.get(`${path}/all`, await getConfigObject())
}
