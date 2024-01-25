import { ActionTree } from "vuex"
import RootState from "@/store/RootState"
import OrderRoutingState from "./OrderRoutingState"
import { OrderRoutingService } from "@/services/RoutingService"
import { hasError, showToast, sortSequence } from "@/utils"
import * as types from './mutation-types'
import logger from "@/logger"
import { Route, RouteFilter } from "@/types"

const actions: ActionTree<OrderRoutingState, RootState> = {
  async fetchOrderRoutingGroups({ commit }) {
    let routingGroups = [] as any;
    // filter groups on the basis of productStoreId
    const payload = {}

    try {
      const resp = await OrderRoutingService.fetchRoutingGroups(payload);

      if(!hasError(resp) && resp.data.length) {
        routingGroups = resp.data
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error(err);
    }

    if(routingGroups.length) {
      routingGroups = sortSequence(routingGroups)
    }

    commit(types.ORDER_ROUTING_GROUPS_UPDATED, routingGroups)
  },

  async createRoutingGroup({ dispatch }, groupName) {
    const payload = {
      groupName,
      productStoreId: "STORE"
    }
    try {
      const resp = await OrderRoutingService.createRoutingGroup(payload)

      if(!hasError(resp)) {
        showToast('Brokering run created')
        dispatch("fetchOrderRoutingGroups")
      }
    } catch(err) {
      showToast("Failed to create brokering run")
      logger.error('err', err)
    }
  },

  async updateRoutingGroup({ commit, state }, payload) {
    const current = JSON.parse(JSON.stringify(state.currentGroup))

    const params = {
      routingGroupId: payload.routingGroupId,
      [payload.fieldToUpdate]: payload.value
    }

    try {
      const resp = await OrderRoutingService.updateRoutingGroup(params);

      if(!hasError(resp) && resp.data.routingGroupId) {
        current[payload.fieldToUpdate] = payload.value
        showToast("Rounting group information updated")
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error(err);
    }
    commit(types.ORDER_ROUTING_CURRENT_GROUP_UPDATED, current)
  },

  async fetchCurrentRoutingGroup({ dispatch, state }, routingGroupId) {
    const current = state.currentGroup
    if(current.routingGroupId && current.routingGroupId === routingGroupId) {
      dispatch("setCurrentRoutingGroup", current)
      return;
    }

    let currentGroup = {}

    try {
      const resp = await OrderRoutingService.fetchRoutingGroup(routingGroupId);

      if(!hasError(resp) && resp.data) {
        currentGroup = resp.data
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error(err);
    }

    dispatch("setCurrentRoutingGroup", currentGroup)
  },

  async setCurrentRoutingGroup({ commit }, payload) {
    commit(types.ORDER_ROUTING_CURRENT_GROUP_UPDATED, payload)
  },

  async fetchOrderRoutings({ commit }, routingGroupId) {
    let orderRoutings = [] as any;
    // filter groups on the basis of productStoreId
    const payload = {
      routingGroupId
    }

    try {
      const resp = await OrderRoutingService.fetchOrderRoutings(payload);

      if(!hasError(resp) && resp.data.length) {
        orderRoutings = resp.data
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error(err);
    }

    if(orderRoutings.length) {
      orderRoutings = sortSequence(orderRoutings)
    }

    commit(types.ORDER_ROUTINGS_UPDATED, orderRoutings)
  },

  async createOrderRouting({ commit, state }, payload) {
    let orderRoutings = JSON.parse(JSON.stringify(state.routes))
    let orderRoutingId = ''

    try {
      const resp = await OrderRoutingService.createOrderRouting(payload)

      if(!hasError(resp) && resp?.data.orderRoutingId) {
        orderRoutingId = resp.data.orderRoutingId
        orderRoutings.push({
          ...payload,
          orderRoutingId
        })
        showToast('New Order Routing Created')
      }

      // Sort the routings and update the state only on success
      if(orderRoutings.length) {
        orderRoutings = sortSequence(orderRoutings)
      }

      commit(types.ORDER_ROUTINGS_UPDATED, orderRoutings)
    } catch(err) {
      showToast("Failed to create order routing")
      logger.error('err', err)
    }

    return orderRoutingId;
  },

  async updateOrderRouting({ commit, state }, payload) {
    let orderRoutings = JSON.parse(JSON.stringify(state.routes))
    const field: Route[keyof Route] = payload.fieldToUpdate
    let orderRoutingId = ''

    const params = {
      orderRoutingId: payload.orderRoutingId,
      [field]: payload.value  // only one field can be updated once for orderRouting
    }

    try {
      const resp = await OrderRoutingService.updateOrderRouting(params);

      if(!hasError(resp) && resp.data.orderRoutingId) {
        orderRoutingId = resp.data.orderRoutingId
        orderRoutings.map((routing: Route) => {
          if(routing.orderRoutingId === orderRoutingId) {
            routing[field] = payload.value
          }
        })
        showToast("Order routing information updated")
      } else {
        throw resp.data
      }
    } catch(err) {
      showToast("Failed to update order routing")
      logger.error(err);
    }

    if(orderRoutings.length) {
      orderRoutings = sortSequence(orderRoutings)
    }

    commit(types.ORDER_ROUTINGS_UPDATED, orderRoutings)
    return orderRoutingId;
  },

  async fetchCurrentOrderRouting({ dispatch }, orderRoutingId) {
    let currentRoute = {} as any

    try {
      const resp = await OrderRoutingService.fetchOrderRoutingInformation(orderRoutingId);

      if(!hasError(resp) && resp.data.orderRoutingId) {
        currentRoute = resp.data

        // Check and update the structure of orderFilters to use in app
        if(resp.data.orderFilters?.length) {
          // sorting the filters as per the seqNum
          resp.data.orderFilters = sortSequence(resp.data.orderFilters)
          currentRoute["orderFilters"] = resp.data.orderFilters.reduce((filters: any, filter: RouteFilter) => {
            if(filters[filter.conditionTypeEnumId]) {
              filters[filter.conditionTypeEnumId][filter.fieldName] = filter
            } else {
              filters[filter.conditionTypeEnumId] = {
                [filter.fieldName]: filter
              }
            }
            return filters
          }, {})
        }

        if(resp.data.rules?.length) {
          currentRoute["rules"] = sortSequence(resp.data.rules)
        }
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error(err);
    }

    dispatch("setCurrentOrderRouting", currentRoute)
  },

  async setCurrentOrderRouting({ commit }, payload) {
    commit(types.ORDER_ROUTING_CURRENT_ROUTE_UPDATED, payload)
  },

  async fetchRoutingRules({ commit }, orderRoutingId) {
    let routingRules = [] as any;
    // filter groups on the basis of productStoreId
    const payload = {
      orderRoutingId
    }

    try {
      const resp = await OrderRoutingService.fetchRoutingRules(payload);

      if(!hasError(resp) && resp.data.length) {
        routingRules = resp.data
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error(err);
    }

    if(routingRules.length) {
      routingRules = sortSequence(routingRules)
    }

    commit(types.ORDER_ROUTING_RULES_UPDATED, routingRules)
  },

  async createRoutingRule({ commit, state }, payload) {
    const currentRoute = JSON.parse(JSON.stringify(state.currentRoute))
    let routingRules = currentRoute.rules
    let routingRuleId = ''

    try {
      const resp = await OrderRoutingService.createRoutingRule(payload)

      if(!hasError(resp) && resp?.data.routingRuleId) {
        routingRuleId = resp.data.routingRuleId
        // Use the routingRuleId received in response, as we are passing empty routingRuleId in request
        routingRules.push({
          ...payload,
          routingRuleId
        })
        showToast('New inventory rule created')

        // Sort the routings and update the state only on success
        if(routingRules.length) {
          routingRules = sortSequence(routingRules)
        }

        commit(types.ORDER_ROUTING_CURRENT_ROUTE_UPDATED, currentRoute)
      }
    } catch(err) {
      showToast("Failed to create rule")
      logger.error('err', err)
    }

    return routingRuleId;
  },

  async fetchRoutingFilters({ commit }, orderRoutingId) {
    let routingFilters = {} as any;
    // filter groups on the basis of productStoreId
    const payload = {
      orderRoutingId
    }

    try {
      const resp = await OrderRoutingService.fetchRoutingFilters(payload);

      if(!hasError(resp) && resp.data.length) {
        routingFilters = resp.data.reduce((filters: any, filter: RouteFilter) => {
          if(filters[filter.conditionTypeEnumId]) {
            filters[filter.conditionTypeEnumId][filter.fieldName] = filter
          } else {
            filters[filter.conditionTypeEnumId] = {
              [filter.fieldName]: filter
            }
          }
          return filters
        }, {})
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error(err);
    }

    const sortEnum = "ENTCT_SORT_BY"

    // As we only need to add support of reordering for sortBy filter
    if(routingFilters[sortEnum]?.length) {
      routingFilters[sortEnum] = sortSequence(routingFilters[sortEnum])
    }

    commit(types.ORDER_ROUTING_FILTERS_UPDATED, routingFilters)
  },

  async deleteRoutingFilters({ dispatch }, payload) {
    // TODO: check if we can call request in parallel for delete operation
    let hasAllFiltersDeletedSuccessfully = true;
    try {
      await payload.filters.forEach(async (filter: any) => {
        const resp = await OrderRoutingService.deleteRoutingFilter({
          orderRoutingId: payload.orderRoutingId,
          conditionSeqId: filter.conditionSeqId
        });
        if(hasError(resp) || !resp.data.orderRoutingId) {
          hasAllFiltersDeletedSuccessfully = false
        }
      });
    } catch(err) {
      logger.error(err);
    }

    dispatch("fetchRoutingFilters", payload.orderRoutingId)

    return hasAllFiltersDeletedSuccessfully
  },

  async createRoutingFilters({ dispatch }, payload) {
    // TODO: check if we can call request in parallel for create operation
    let hasAllFiltersCreatedSuccessfully = true;
    try {
      await payload.filters.forEach(async (filter: any) => {
        const resp = await OrderRoutingService.updateRoutingFilter({
          orderRoutingId: payload.orderRoutingId,
          ...filter
        });
        if(hasError(resp) || !resp.data.orderRoutingId) {
          hasAllFiltersCreatedSuccessfully = false
        }
      });
    } catch(err) {
      logger.error(err);
    }

    dispatch("fetchRoutingFilters", payload.orderRoutingId)
    return hasAllFiltersCreatedSuccessfully
  },

  async fetchRuleConditions({ commit }, routingRuleId) {
    let ruleConditions = {} as any;
    // filter groups on the basis of productStoreId
    const payload = {
      routingRuleId
    }

    try {
      const resp = await OrderRoutingService.fetchRuleConditions(payload);

      if(!hasError(resp) && resp.data.length) {
        ruleConditions = resp.data.reduce((conditions: any, condition: any) => {
          if(conditions[condition.conditionTypeEnumId]) {
            conditions[condition.conditionTypeEnumId][condition.fieldName] = condition
          } else {
            conditions[condition.conditionTypeEnumId] = {
              [condition.fieldName]: condition
            }
          }
          return conditions
        }, {})
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error(err);
    }

    const sortEnum = "ENTCT_SORT_BY"

    // As we only need to add support of reordering for sortBy filter
    if(ruleConditions[sortEnum]?.length) {
      ruleConditions[sortEnum] = sortSequence(ruleConditions[sortEnum])
    }

    commit(types.ORDER_ROUTING_RULE_CONDITIONS_UPDATED, ruleConditions)
  },

  async deleteRuleConditions({ dispatch }, payload) {
    // TODO: check if we can call request in parallel for delete operation
    let hasAllConditionsDeletedSuccessfully = true;
    try {
      await payload.conditions.forEach(async (condition: any) => {
        const resp = await OrderRoutingService.deleteRuleCondition({
          routingRuleId: payload.routingRuleId,
          conditionSeqId: condition.conditionSeqId
        });
        if(hasError(resp) || !resp.data.conditionSeqId) {
          hasAllConditionsDeletedSuccessfully = false
        }
      });
    } catch(err) {
      logger.error(err);
    }

    dispatch("fetchRuleConditions", payload.routingRuleId)

    return hasAllConditionsDeletedSuccessfully
  },

  async createRuleConditions({ dispatch }, payload) {
    let hasAllConditionsCreatedSuccessfully = true;
    try {
      await payload.conditions.forEach(async (condition: any) => {
        const resp = await OrderRoutingService.createRuleCondition({
          routingRuleId: payload.routingRuleId,
          ...condition
        });
        if(!hasError(resp) || !resp.data.conditionSeqId) {
          hasAllConditionsCreatedSuccessfully = false
        }
      });
    } catch(err) {
      logger.error(err);
    }

    // TODO: check if we can call the action only once after all the operations are success
    dispatch("fetchRuleConditions", payload.routingRuleId)
    return hasAllConditionsCreatedSuccessfully
  },

  async fetchRuleActions({ commit }, routingRuleId) {
    let ruleActions = {} as any;
    const payload = {
      routingRuleId
    }

    try {
      const resp = await OrderRoutingService.fetchRuleActions(payload);

      if(!hasError(resp) && resp.data.length) {
        ruleActions = resp.data.reduce((actions: any, action: any) => {
          // considering that only one value for an action is available
          actions[action.actionTypeEnumId] = action
          return actions
        }, {})
      } else {
        throw resp.data
      }
    } catch(err) {
      logger.error(err);
    }

    commit(types.ORDER_ROUTING_RULE_ACTIONS_UPDATED, ruleActions)
  },

  async fetchInventoryRuleInformation({ commit, state }, routingRuleId) {
    const rulesInformation = JSON.parse(JSON.stringify(state.rules))

    // Do not fetch the rule information if its already available in state. This condition will be false on refresh as state will be cleared so automatically updated information will be fetched
    if(rulesInformation[routingRuleId]) {
      return;
    }

    try {
      const resp = await OrderRoutingService.fetchInventoryRuleInformation(routingRuleId)

      if(!hasError(resp) && resp.data.routingRuleId) {
        rulesInformation[routingRuleId] = {}

        if(resp.data.inventoryFilters?.length) {
          rulesInformation[routingRuleId]["inventoryFilters"] = resp.data.inventoryFilters.reduce((conditions: any, condition: any) => {
            if(conditions[condition.conditionTypeEnumId]) {
              conditions[condition.conditionTypeEnumId][condition.fieldName] = condition
            } else {
              conditions[condition.conditionTypeEnumId] = {
                [condition.fieldName]: condition
              }
            }
            return conditions
          }, {})

          const sortEnum = "ENTCT_SORT_BY"

          // As we only need to add support of reordering for sortBy filter
          if(rulesInformation[routingRuleId]["inventoryFilters"][sortEnum]?.length) {
            rulesInformation[routingRuleId]["inventoryFilters"][sortEnum] = sortSequence(rulesInformation[routingRuleId]["inventoryFilters"][sortEnum])
          }
        }

        if(resp.data.actions?.length) {
          rulesInformation[routingRuleId]["actions"] = resp.data.actions.reduce((actions: any, action: any) => {
            // considering that only one value for an action is available
            actions[action.actionTypeEnumId] = action
            return actions
          }, {})
        }
      }
    } catch(err) {
      logger.error(err)
    }

    commit(types.ORDER_ROUTING_RULES_UPDATED, rulesInformation)
    return rulesInformation[routingRuleId]
  },

  async updateOrderRoutingInformation({ dispatch }, payload) {
    try {
      await OrderRoutingService.updateOrderRoutingInformation(payload)
    } catch(err) {
      logger.error(err)
    } 
  }
}

export default actions;