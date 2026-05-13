import { Hono } from 'hono'
import type { ApiBindings } from '../bindings'
import adminAuthRoute from './auth/admin.route'
import catalogRoute from './catalog/list.route'
import orderRoute from './order/detail.route'
import healthRoute from './system/health.route'
import pingRoute from './system/ping.route'
import userRoute from './user/profile.route'

const routes = new Hono<{ Bindings: ApiBindings }>()

const appRoutes = routes
  .route('/health', healthRoute)
  .route('/auth/admin', adminAuthRoute)
  .route('/rpc/system/ping', pingRoute)
  .route('/rpc/catalog', catalogRoute)
  .route('/rpc/user', userRoute)
  .route('/rpc/order', orderRoute)

export type RoutesType = typeof appRoutes

export default appRoutes
