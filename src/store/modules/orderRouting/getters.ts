import { GetterTree } from "vuex"
import OrderRoutingState from "./OrderRoutingState"
import RootState from "@/store/RootState"

const getters: GetterTree<OrderRoutingState, RootState> = {
  getRoutingGroups(state) {
    return state.groups
  },
  getRoutingRules(state) {
    return JSON.parse(JSON.stringify(state.currentRoute["rules"]))
  },
  getCurrentRoutingGroup(state) {
    return JSON.parse(JSON.stringify(state.currentGroup))
  },
  getCurrentOrderRouting(state) {
    return JSON.parse(JSON.stringify(state.currentRoute))
  },
  getRoutingRuleInformation(state) {
    return state.rules
  },
  getCurrentRouteFilters(state) {
    return JSON.parse(JSON.stringify(state.currentRoute["orderFilters"]))
  },
  getRuleConditions: (state) => (routingRuleId: string) => {
    return state.rules[routingRuleId].inventoryFilters ? JSON.parse(JSON.stringify(state.rules[routingRuleId].inventoryFilters)) : {}
  },
  getRuleActions: (state) => (routingRuleId: string) => {
    return state.rules[routingRuleId].actions ? JSON.parse(JSON.stringify(state.rules[routingRuleId].actions)) : {}
  }
}

export default getters;