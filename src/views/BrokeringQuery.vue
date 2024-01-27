<template>
  <ion-page>
    <ion-content>
      <div>
        <div class="menu">
          <ion-item lines="none">
            <ion-label>{{ currentRouting.routingName }}</ion-label>
            <ion-chip slot="end" outline @click="router.go(-1)">
              <!-- TODO: make route index and count dynamic -->
              {{ "2/4" }}
              <ion-icon :icon="chevronUpOutline" />
            </ion-chip>
          </ion-item>
          <ion-button expand="block" @click="save">{{ "Save Changes" }}</ion-button>
          <ion-item-group>
            <ion-item-divider color="light">
              <ion-label>{{ "Filters" }}</ion-label>
              <ion-button fill="clear" @click="addOrderRouteFilterOptions('ORD_FILTER_PRM_TYPE', 'ENTCT_FILTER', 'Filters')">
                <ion-icon slot="icon-only" :icon="optionsOutline"/>
              </ion-button>
            </ion-item-divider>
            <p class="empty-state" v-if="!orderRoutingFilters['ENTCT_FILTER'] || !Object.keys(orderRoutingFilters['ENTCT_FILTER']).length">{{ "Select filter to apply" }}</p>
            <!-- Using hardcoded options for filters, as in filters we have multiple ways of value selection for filters like select, chip -->
            <ion-item v-if="getFilterValue(orderRoutingFilters, ruleEnums, 'QUEUE')">
              <ion-select label="Queue" interface="popover" :value="getFilterValue(orderRoutingFilters, ruleEnums, 'QUEUE').fieldValue" @ionChange="updateOrderFilterValue($event, 'ENTCT_FILTER', 'QUEUE')">
                <ion-select-option v-for="(facility, facilityId) in facilities" :key="facilityId" :value="facilityId">{{ facility.facilityName || facilityId }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item v-if="getFilterValue(orderRoutingFilters, ruleEnums, 'SHIPPING_METHOD')">
              <ion-select interface="popover" label="Shipping method" :value="getFilterValue(orderRoutingFilters, ruleEnums, 'SHIPPING_METHOD').fieldValue" @ionChange="updateOrderFilterValue($event, 'ENTCT_FILTER', 'SHIPPING_METHOD')">
                <ion-select-option v-for="(shippingMethod, shippingMethodId) in shippingMethods" :key="shippingMethodId" :value="shippingMethodId">{{ shippingMethod.shippingMethodId || shippingMethodId }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item v-if="getFilterValue(orderRoutingFilters, ruleEnums, 'PRIORITY')">
              <ion-select interface="popover" label="Order priority" :value="getFilterValue(orderRoutingFilters, ruleEnums, 'PRIORITY').fieldValue" @ionChange="updateOrderFilterValue($event, 'ENTCT_FILTER', 'PRIORITY')">
                <ion-select-option value="HIGH">{{ "High" }}</ion-select-option>
                <ion-select-option value="MEDIUM">{{ "Medium" }}</ion-select-option>
                <ion-select-option value="Low">{{ "Low" }}</ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item v-if="getFilterValue(orderRoutingFilters, ruleEnums, 'PROMISE_DATE')">
              <ion-label>{{ "Promise date" }}</ion-label>
              <ion-chip outline @click="selectPromiseFilterValue($event)">
                <!-- TODO: need to display a string in place of just the value -->
                {{ getFilterValue(orderRoutingFilters, ruleEnums, 'PROMISE_DATE').fieldValue || getFilterValue(orderRoutingFilters, ruleEnums, 'PROMISE_DATE').fieldValue == 0 ? getFilterValue(orderRoutingFilters, ruleEnums, 'PROMISE_DATE').fieldValue : '-' }}
              </ion-chip>
            </ion-item>
            <ion-item v-if="getFilterValue(orderRoutingFilters, ruleEnums, 'SALES_CHANNEL')">
              <ion-select label="Sales Channel" interface="popover" :value="getFilterValue(orderRoutingFilters, ruleEnums, 'SALES_CHANNEL').fieldValue" @ionChange="updateOrderFilterValue($event, 'ENTCT_FILTER', 'SALES_CHANNEL')">
                <ion-select-option v-for="(enumInfo, enumId) in enums['ORDER_SALES_CHANNEL']" :key="enumId" :value="enumId">{{ enumInfo.description || enumInfo.enumId }}</ion-select-option>
              </ion-select>
            </ion-item>
          </ion-item-group>
          <ion-item-group>
            <ion-item-divider color="light">
              <ion-label>{{ "Sort" }}</ion-label>
              <ion-button fill="clear" @click="addOrderRouteFilterOptions('ORD_SORT_PARAM_TYPE', 'ENTCT_SORT_BY', 'Sort')">
                <ion-icon slot="icon-only" :icon="optionsOutline"/>
              </ion-button>
            </ion-item-divider>
            <!-- Added check for undefined as well as empty object, as on initial load there might be a case in which route sorting options are not available thus it will be undefined but when updating the values from the modal this will always return an object -->
            <p class="empty-state" v-if="!getOrderSortOptions || !Object.keys(getOrderSortOptions).length">{{ "Select sorting to apply" }}</p>
            <ion-reorder-group @ionItemReorder="doRouteSortReorder($event)" :disabled="false">
              <ion-item v-for="(sort, code) in getOrderSortOptions" :key="code">
                <ion-label>{{ getLabel("ORD_SORT_PARAM_TYPE", code) || code }}</ion-label>
                <ion-reorder />
              </ion-item>
            </ion-reorder-group>
          </ion-item-group>
        </div>
        <div class="menu">
          <ion-list>
            <ion-reorder-group @ionItemReorder="doReorder($event)" :disabled="false">
              <ion-item v-for="rule in inventoryRules" :key="rule.routingRuleId && inventoryRules.length" :color="rule.routingRuleId === selectedRoutingRule.routingRuleId ? 'light' : ''" @click="fetchRuleInformation(rule.routingRuleId)" button>
                <ion-label>{{ rule.ruleName }}</ion-label>
                <!-- Don't display reordering option when there is a single rule -->
                <ion-reorder v-show="inventoryRules.length > 1" />
              </ion-item>
            </ion-reorder-group>
          </ion-list>
          <ion-button fill="outline" @click="addInventoryRule">
            {{ "Add inventory rule" }}
            <ion-icon :icon="addCircleOutline"/>
          </ion-button>
        </div>
        <div>
          <ion-item lines="none">
            <!-- TODO: add support to archive a rule, add rule status Desc, and add color option -->
            <ion-label>{{ "Rule Status" }}</ion-label>
            <ion-badge v-if="selectedRoutingRule.statusId === 'RULE_DRAFT'" @click="updateRuleStatus('RULE_ACTIVE')">{{ selectedRoutingRule.statusId }}</ion-badge>
            <ion-badge v-else>{{ selectedRoutingRule.statusId }}</ion-badge>
          </ion-item>
          <section class="filters">
            <ion-card>
              <ion-item>
                <ion-icon slot="start" :icon="filterOutline"/>
                <ion-label>{{ "Filters" }}</ion-label>
                <ion-button fill="clear" @click="addInventoryFilterOptions('INV_FILTER_PRM_TYPE', 'ENTCT_FILTER', 'Filters')">
                  <ion-icon slot="icon-only" :icon="optionsOutline"/>
                </ion-button>
              </ion-item>
              <p class="empty-state" v-if="!inventoryRuleConditions['ENTCT_FILTER'] || !Object.keys(inventoryRuleConditions['ENTCT_FILTER']).length">{{ "Select filter to apply" }}</p>
              <ion-item v-if="getFilterValue(inventoryRuleConditions, conditionFilterEnums, 'FACILITY_GROUP')">
                <ion-select interface="popover" label="Group" :value="getFilterValue(inventoryRuleConditions, conditionFilterEnums, 'FACILITY_GROUP').fieldValue" @ionChange="updateRuleFilterValue($event, 'ENTCT_FILTER', 'FACILITY_GROUP')">
                  <ion-select-option v-for="(facilityGroup, facilityGroupId) in facilityGroups" :key="facilityGroupId" :value="facilityGroupId">{{ facilityGroup.description || facilityGroupId }}</ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item v-if="getFilterValue(inventoryRuleConditions, conditionFilterEnums, 'PROXIMITY')">
                <!-- TODO: Confirm on the possible options -->
                <ion-label>{{ "Proximity" }}</ion-label>
                <ion-chip outline>
                  <ion-select aria-label="measurement" interface="popover" :value="getFilterValue(inventoryRuleConditions, conditionFilterEnums, 'MEASUREMENT_SYSTEM')?.fieldValue" @ionChange="updateRuleFilterValue($event, 'ENTCT_FILTER', 'MEASUREMENT_SYSTEM')">
                    <ion-select-option value="METRIC">{{ "kms" }}</ion-select-option>
                    <ion-select-option value="IMPERIAL">{{ "miles" }}</ion-select-option>
                  </ion-select>
                </ion-chip>
                <ion-chip outline @click="selectValue('PROXIMITY', 'Add proximity')">{{ getFilterValue(inventoryRuleConditions, conditionFilterEnums, 'PROXIMITY').fieldValue || getFilterValue(inventoryRuleConditions, conditionFilterEnums, 'PROXIMITY').fieldValue == 0 ? getFilterValue(inventoryRuleConditions, conditionFilterEnums, 'PROXIMITY').fieldValue : '-' }}</ion-chip>
              </ion-item>
              <ion-item v-if="getFilterValue(inventoryRuleConditions, conditionFilterEnums, 'BRK_SAFETY_STOCK')">
                <ion-label>{{ "Brokering safety stock" }}</ion-label>
                <ion-chip outline>
                  <ion-select aria-label="operator" interface="popover" :value="getFilterValue(inventoryRuleConditions, conditionFilterEnums, 'BRK_SAFETY_STOCK').operator" @ionChange="updateOperator($event)">
                    <ion-select-option v-for="(enumeration, id) in enums['COMPARISON_OPERATOR']" :key="id" :value="enumeration.enumCode">{{ enumeration.description || enumeration.enumCode }}</ion-select-option>
                  </ion-select>
                </ion-chip>
                <ion-chip outline @click="selectValue('BRK_SAFETY_STOCK', 'Add safety stock')">{{ getFilterValue(inventoryRuleConditions, conditionFilterEnums, 'BRK_SAFETY_STOCK').fieldValue || getFilterValue(inventoryRuleConditions, conditionFilterEnums, 'BRK_SAFETY_STOCK').fieldValue == 0 ? getFilterValue(inventoryRuleConditions, conditionFilterEnums, 'BRK_SAFETY_STOCK').fieldValue : '-' }}</ion-chip>
              </ion-item>
            </ion-card>
            <ion-card>
              <ion-item>
                <ion-icon slot="start" :icon="swapVerticalOutline"/>
                <ion-label>{{ "Sort" }}</ion-label>
                <ion-button fill="clear" @click="addInventoryFilterOptions('INV_SORT_PARAM_TYPE', 'ENTCT_SORT_BY', 'Sort')">
                  <ion-icon slot="icon-only" :icon="optionsOutline"/>
                </ion-button>
              </ion-item>
              <p class="empty-state" v-if="!inventoryRuleConditions['ENTCT_SORT_BY'] || !Object.keys(inventoryRuleConditions['ENTCT_SORT_BY']).length">{{ "Select sorting to apply" }}</p>
              <ion-reorder-group @ionItemReorder="doConditionSortReorder($event)" :disabled="false">
                <ion-item v-for="(sort, code) in inventoryRuleConditions['ENTCT_SORT_BY']" :key="code">
                  <ion-label>{{ getLabel("INV_SORT_PARAM_TYPE", code) || code }}</ion-label>
                  <ion-reorder />
                </ion-item>
              </ion-reorder-group>
            </ion-card>
          </section>
          <section>
            <h2 class="ion-padding-start">{{ "Actions" }}</h2>
            <div class="actions">
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    {{ "Allocated Items" }}
                  </ion-card-title>
                </ion-card-header>
                <ion-item lines="none">
                  <ion-toggle :checked="ruleActions[actionEnums['RM_AUTO_CANCEL_DATE'].id]?.actionValue" @ionChange="updateClearAutoCancelDays($event.detail.checked)">{{ "Clear auto cancel days" }}</ion-toggle>
                </ion-item>
              </ion-card>
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    {{ "Partially available" }}
                  </ion-card-title>
                </ion-card-header>
                <ion-card-content>
                  {{ "Select if partial allocation should be allowed in this inventory rule" }}
                </ion-card-content>
                <ion-item lines="none">
                  <ion-toggle :checked="selectedRoutingRule.assignmentEnumId === 'ORA_MULTI'" @ionChange="updatePartialAllocation($event.detail.checked)">{{ "Allow partial allocation" }}</ion-toggle>
                </ion-item>
              </ion-card>
              <ion-card>
                <ion-card-header>
                  <ion-card-title>
                    {{ "Unavailable items" }}
                  </ion-card-title>
                </ion-card-header>
                <ion-item lines="none">
                  <ion-select label="Move items to" interface="popover" :value="ruleActionType" @ionChange="updateRuleActionType($event.detail.value)">
                    <ion-select-option :value="actionEnums['NEXT_RULE'].id">
                      {{ "Next rule" }}
                      <ion-icon :icon="playForwardOutline"/>
                    </ion-select-option>
                    <ion-select-option :value="actionEnums['MOVE_TO_QUEUE'].id">
                      {{ "Queue" }}
                      <ion-icon :icon="golfOutline"/>
                    </ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-item lines="none" v-show="ruleActionType === actionEnums['MOVE_TO_QUEUE'].id">
                  <ion-select label="Queue" interface="popover" :value="ruleActions[ruleActionType]?.actionValue" @ionChange="updateRuleActionValue($event.detail.value)">
                    <ion-select-option v-for="(facility, facilityId) in facilities" :key="facilityId" :value="facilityId">{{ facility.facilityName || facilityId }}</ion-select-option>
                  </ion-select>
                </ion-item>
                <ion-item lines="none">
                  <ion-label>{{ "Auto cancel days" }}</ion-label>
                  <ion-chip outline @click="updateAutoCancelDays(autoCancelDays)">{{ autoCancelDays ? `${autoCancelDays} days` : '-' }}</ion-chip>
                </ion-item>
              </ion-card>
            </div>
          </section>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonBadge, IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip, IonContent, IonIcon, IonItem, IonItemDivider, IonItemGroup, IonLabel, IonList, IonPage, IonReorder, IonReorderGroup, IonSelect, IonSelectOption, IonToggle, alertController, modalController, onIonViewWillEnter, popoverController } from "@ionic/vue";
import { addCircleOutline, chevronUpOutline, filterOutline, golfOutline, optionsOutline, playForwardOutline, swapVerticalOutline } from "ionicons/icons"
import { useRouter } from "vue-router";
import { computed, defineProps, ref } from "vue";
import store from "@/store";
import AddInventoryFilterOptionsModal from "@/components/AddInventoryFilterOptionsModal.vue";
import { showToast } from "@/utils";
import { Rule } from "@/types";
import AddOrderRouteFilterOptions from "@/components/AddOrderRouteFilterOptions.vue"
import PromiseFilterPopover from "@/components/PromiseFilterPopover.vue"
import logger from "@/logger";
import { DateTime } from "luxon";

const router = useRouter();
const props = defineProps({
  orderRoutingId: {
    type: String,
    required: true
  }
})

const ruleEnums = JSON.parse(process.env?.VUE_APP_RULE_ENUMS as string)
const actionEnums = JSON.parse(process.env?.VUE_APP_RULE_ACTION_ENUMS as string)
const conditionFilterEnums = JSON.parse(process.env?.VUE_APP_RULE_FILTER_ENUMS as string)
const autoCancelDays = ref(0)
const ruleActionType = ref('')
let orderRoutingFilters = ref({}) as any
let selectedRoutingRule = ref({}) as any
let inventoryRuleConditions = ref({}) as any
let inventoryRules = ref([]) as any

const currentRouting = computed(() => store.getters["orderRouting/getCurrentOrderRouting"])
const inventoryRulesInformation = computed(() => store.getters["orderRouting/getRoutingRuleInformation"])

const ruleActions = ref({}) as any
const rulesInformation = ref({}) as any

const facilities = computed(() => store.getters["util/getFacilities"])
const enums = computed(() => store.getters["util/getEnums"])
const shippingMethods = computed(() => store.getters["util/getShippingMethods"])
const facilityGroups = computed(() => store.getters["util/getFacilityGroups"])

const getOrderSortOptions = computed(() => {
  return orderRoutingFilters.value['ENTCT_SORT_BY'] ? Object.keys(orderRoutingFilters.value['ENTCT_SORT_BY']).reduce((filters: any, key: string) => {
    if(orderRoutingFilters.value['ENTCT_SORT_BY'][key].method !== "DELETE") {
      filters[key] = orderRoutingFilters.value['ENTCT_SORT_BY'][key]
    }
    return filters
  }, {}) : {}
})

onIonViewWillEnter(async () => {
  await Promise.all([store.dispatch("orderRouting/fetchCurrentOrderRouting", props.orderRoutingId), store.dispatch("util/fetchFacilities"), store.dispatch("util/fetchEnums", { enumTypeId: "ORDER_SALES_CHANNEL" }), store.dispatch("util/fetchShippingMethods"), store.dispatch("util/fetchFacilityGroups")])

  orderRoutingFilters.value = currentRouting.value["orderFilters"] ? JSON.parse(JSON.stringify(currentRouting.value["orderFilters"])) : {}

  // Added check to not fetch any rule related information as when a new route will be created no rule will be available thus no need to fetch any other information
  if(!currentRouting.value["rules"].length) {
    return;
  }

  inventoryRules.value = JSON.parse(JSON.stringify(currentRouting.value["rules"]))

  await fetchRuleInformation(inventoryRules.value[0].routingRuleId);

  // Deep cloning object only once on page load
  rulesInformation.value = JSON.parse(JSON.stringify(inventoryRulesInformation.value))
})

async function fetchRuleInformation(routingRuleId: string) {
  // When clicking the same enum again do not fetch its information
  // TODO: check behaviour when creating a new rule, when no rule exist and when already some rule exist and a rule is open
  if(selectedRoutingRule.value.routingRuleId === routingRuleId) {
    return;
  }

  // Only fetch the rules information, if already not present, as we are updating rule values
  if(!rulesInformation.value[routingRuleId]) {
    rulesInformation.value[routingRuleId] = await store.dispatch("orderRouting/fetchInventoryRuleInformation", routingRuleId)
  }

  // If there is not an already selected rule, deep clone it for usage. This condition can occur when we does not have any inventory rules for the route and we have created a new rule
  if(!selectedRoutingRule.value.routingRuleId) {
    rulesInformation.value = JSON.parse(JSON.stringify(inventoryRulesInformation.value))
  }

  selectedRoutingRule.value = inventoryRules.value.find((rule: Rule) => rule.routingRuleId === routingRuleId)

  ruleActions.value = rulesInformation.value[routingRuleId].actions ? JSON.parse(JSON.stringify(rulesInformation.value[routingRuleId].actions)) : {}
  inventoryRuleConditions.value = rulesInformation.value[routingRuleId].inventoryFilters ? JSON.parse(JSON.stringify(rulesInformation.value[routingRuleId].inventoryFilters)) : {}

  autoCancelDays.value = ruleActions.value[actionEnums["AUTO_CANCEL_DAYS"].id]?.actionValue

  const actionTypes = ["ORA_NEXT_RULE", "ORA_MV_TO_QUEUE"]
  ruleActionType.value = Object.keys(ruleActions.value).find((actionId: string) => {
    return actionTypes.includes(actionId)
  }) || ''
}

function updateRuleInformation() {
  rulesInformation.value[selectedRoutingRule.value.routingRuleId]["inventoryFilters"] = inventoryRuleConditions.value
  rulesInformation.value[selectedRoutingRule.value.routingRuleId]["actions"] = ruleActions.value
}

async function addInventoryFilterOptions(parentEnumId: string, conditionTypeEnumId: string, label = "") {
  if(!selectedRoutingRule.value.routingRuleId) {
    showToast('Failed to identify selected inventory rule, please select a rule or refresh')
    logger.error('Failed to identify selected inventory rule, please select a rule or refresh')
    return;
  }
  
  const inventoryFilterOptionsModal = await modalController.create({
    component: AddInventoryFilterOptionsModal,
    componentProps: { ruleConditions: inventoryRuleConditions.value, routingRuleId: selectedRoutingRule.value.routingRuleId, parentEnumId, conditionTypeEnumId, label }
  })

  inventoryFilterOptionsModal.onDidDismiss().then((result: any) => {
    // Using role to determine when to update the filters
    // When closing the modal without save and when unselecting all the filter, in both the cases we get filters object as empty thus passing a role from the modal to update the filter only when save action is performed
    if(result.data?.filters && result.role === 'save') {
      inventoryRuleConditions.value = result.data.filters
      updateRuleInformation()
    }
  })

  await inventoryFilterOptionsModal.present();
}

async function addOrderRouteFilterOptions(parentEnumId: string, conditionTypeEnumId: string, label = "") {
  const orderRouteFilterOptions = await modalController.create({
    component: AddOrderRouteFilterOptions,
    componentProps: { orderRoutingFilters: orderRoutingFilters.value, orderRoutingId: props.orderRoutingId, parentEnumId, conditionTypeEnumId, label }
  })

  orderRouteFilterOptions.onDidDismiss().then((result: any) => {
    // Using role to determine when to update the filters
    // When closing the modal without save and when unselecting all the filter, in both the cases we get filters object as empty thus passing a role from the modal to update the filter only when save action is performed
    if(result.data?.filters && result.role === 'save') {
      orderRoutingFilters.value = result.data.filters
    }
  })

  await orderRouteFilterOptions.present();
}

async function addInventoryRule() {
  const newRuleAlert = await alertController.create({
    header: "New Inventory Rule",
    buttons: [{
      text: "Cancel",
      role: "cancel"
    }, {
      text: "Save"
    }],
    inputs: [{
      name: "ruleName",
      placeholder: "Rule name"
    }]
  })

  newRuleAlert.onDidDismiss().then(async (result: any) => {
    const ruleName = result.data?.values?.ruleName;
    // Considering that when having role in result, its negative action and not need to do anything
    if(!result.role && ruleName) {
      // TODO: check for the default value of params
      const payload = {
        routingRuleId: "",
        orderRoutingId: props.orderRoutingId,
        ruleName,
        statusId: "RULE_DRAFT", // by default considering the rule to be in draft
        sequenceNum: inventoryRules.value.length && inventoryRules.value[inventoryRules.value.length - 1].sequenceNum >= 0 ? inventoryRules.value[inventoryRules.value.length - 1].sequenceNum + 5 : 0,  // added check for `>= 0` as sequenceNum can be 0, that will result in again setting the new route seqNum to 0,
        assignmentEnumId: "ORA_SINGLE", // by default, considering partial fulfillment to be inactive
        createdDate: DateTime.now().toMillis()
      }

      const routingRuleId = await store.dispatch("orderRouting/createRoutingRule", payload)

      if(routingRuleId) {
        fetchRuleInformation(routingRuleId)
      }
    }
  })

  return newRuleAlert.present();
}

function updateRuleActionType(value: string) {
  const actionType = ruleActionType.value
  ruleActionType.value = value

  ruleActions.value[ruleActionType.value] = {
    ...ruleActions.value[actionType],
    actionTypeEnumId: value,
    actionValue: "", // after changing action type, as next_rule action does not need to have a value, so in all cases making intially the value as empty and will update if required from some other function
    method: "UPDATE"
  }
  // deleting previous action type, but using the data of previous action, as we will not call delete action on server for actionTypes
  delete ruleActions.value[actionType]
  updateRuleInformation()
}

function updateRuleActionValue(value: string) {
  if(ruleActions.value[ruleActionType.value]) {
    ruleActions.value[ruleActionType.value]["actionValue"] = value
    ruleActions.value[ruleActionType.value]["method"] = "UPDATE"
  } else {
    ruleActions.value = {
      ...ruleActions.value,
      [ruleActionType.value]: {
        actionValue: value,
        method: "UPDATE"
      }
    }
  }
  updateRuleInformation()
}

async function updateAutoCancelDays(cancelDays: any) {
  const alert = await alertController.create({
    header: "Auto Cancel Days",
    inputs: [{
      name: "autoCancelDays",
      placeholder: "auto cancel days",
      type: "number",
      min: 0,
      value: cancelDays
    }],
    buttons: [{
      text: "Cancel",
      role: "cancel"
    },
    {
      text: "Save",
      handler: (data) => {
        if(data) {
          if(data.autoCancelDays === "") {
            showToast("Please provide a value")
            return false;
          } else if(data.autoCancelDays < 0) {
            showToast("Provide a value greater than or equal to 0")
            return false;
          } else {
            autoCancelDays.value = data.autoCancelDays

            if(ruleActions.value[actionEnums["AUTO_CANCEL_DAYS"].id]) {
              ruleActions.value[actionEnums["AUTO_CANCEL_DAYS"].id].actionValue = data.autoCancelDays
              ruleActions.value[actionEnums["AUTO_CANCEL_DAYS"].id].actionTypeEnumId = actionEnums["AUTO_CANCEL_DAYS"].id
              ruleActions.value[actionEnums["AUTO_CANCEL_DAYS"].id]["method"] = "UPDATE"
            } else {
              ruleActions.value = {
                ...ruleActions.value,
                [actionEnums["AUTO_CANCEL_DAYS"].id]: {
                  actionValue: data.autoCancelDays,
                  actionTypeEnumId: actionEnums["AUTO_CANCEL_DAYS"].id,
                  method: "UDPATE"
                }
              }
            }

            updateRuleInformation()
          }
        }
      }
    }]
  })
  await alert.present()
}

function updatePartialAllocation(checked: any) {
  selectedRoutingRule.value.assignmentEnumId = checked ? "ORA_MULTI" : "ORA_SINGLE"
  updateInventoryRules()
}

function updateClearAutoCancelDays(checked: any) {
  if(ruleActions.value[actionEnums["RM_AUTO_CANCEL_DATE"].id]) {
    ruleActions.value[actionEnums["RM_AUTO_CANCEL_DATE"].id].actionValue = checked
    ruleActions.value[actionEnums["RM_AUTO_CANCEL_DATE"].id].actionTypeEnumId = actionEnums["RM_AUTO_CANCEL_DATE"].id
    ruleActions.value[actionEnums["RM_AUTO_CANCEL_DATE"].id]["method"] = "UPDATE"
  } else {
    ruleActions.value = {
      ...ruleActions.value,
      [actionEnums["RM_AUTO_CANCEL_DATE"].id]: {
        actionValue: checked,
        actionTypeEnumId: actionEnums["RM_AUTO_CANCEL_DATE"].id,
        method: "UDPATE"
      }
    }
  }

  updateRuleInformation()
}

function getFilterValue(options: any, enums: any, parameter: string) {
  if(options["ENTCT_FILTER"]?.[enums[parameter].code] && options["ENTCT_FILTER"]?.[enums[parameter].code]?.method !== 'DELETE') {
    return options["ENTCT_FILTER"]?.[enums[parameter].code]
  }
  return ''
}

function getLabel(parentType: string, code: string) {
  const enumerations = enums.value[parentType]
  const enumInfo: any = Object.values(enumerations).find((enumeration: any) => enumeration.enumCode === code)

  return enumInfo?.description
}

async function selectPromiseFilterValue(ev: CustomEvent) {
  const popover = await popoverController
    .create({
      component: PromiseFilterPopover,
      event: ev,
      translucent: true,
      showBackdrop: true
    })

  popover.onDidDismiss().then((result: any) => {
    getFilterValue(orderRoutingFilters.value, ruleEnums, "PROMISE_DATE").fieldValue = result.data?.isPastDuration ? `-${result.data?.duration}` : result.data?.duration
    getFilterValue(orderRoutingFilters.value, ruleEnums, "PROMISE_DATE").operator = "less-equals"
    getFilterValue(orderRoutingFilters.value, ruleEnums, "PROMISE_DATE").method = currentRouting.value["orderFilters"]?.["ENTCT_FILTER"]?.[ruleEnums["PROMISE_DATE"].code] ? "UPDATE" : "CREATE"
  })

  return popover.present();
}

async function selectValue(id: string, header: string) {
  const valueAlert = await alertController.create({
    header,
    buttons: [{
      text: "Cancel",
      role: "cancel"
    }, {
      text: "Save"
    }],
    inputs: [{
      name: "value",
      placeholder: "value",
      value: getFilterValue(inventoryRuleConditions.value, conditionFilterEnums, id).fieldValue
    }]
  })

  valueAlert.onDidDismiss().then(async (result: any) => {
    const value = result.data?.values?.value;
    // Considering that when having role in result, its negative action and not need to do anything
    if(!result.role && value) {
      getFilterValue(inventoryRuleConditions.value, conditionFilterEnums, id).fieldValue = value
      // When selecting a filter value making the operator value to `equals` which is the default value
      getFilterValue(inventoryRuleConditions.value, conditionFilterEnums, id).operator = "equals"
      getFilterValue(inventoryRuleConditions.value, conditionFilterEnums, id).method = "UPDATE"
      updateRuleInformation()
    }
  })

  return valueAlert.present();
}

function updateOperator(event: CustomEvent) {
  getFilterValue(inventoryRuleConditions.value, conditionFilterEnums, "BRK_SAFETY_STOCK").operator = event.detail.value
  getFilterValue(inventoryRuleConditions.value, conditionFilterEnums, "BRK_SAFETY_STOCK").method = "UPDATE"
  updateRuleInformation()
}

function updateOrderFilterValue(event: CustomEvent, conditionTypeEnumId: string, id: string) {
  orderRoutingFilters.value[conditionTypeEnumId][ruleEnums[id].code].fieldValue = event.detail.value
  orderRoutingFilters.value[conditionTypeEnumId][ruleEnums[id].code].method = currentRouting.value["orderFilters"]?.[conditionTypeEnumId]?.[ruleEnums[id].code] ? "UPDATE" : "CREATE"
}

function updateRuleFilterValue(event: CustomEvent, conditionTypeEnumId: string, id: string) {
  inventoryRuleConditions.value[conditionTypeEnumId][conditionFilterEnums[id].code].fieldValue = event.detail.value
  inventoryRuleConditions.value[conditionTypeEnumId][conditionFilterEnums[id].code].method = "UDPATE"
  updateRuleInformation()
}

// Updates the inventoryRules array when there are any changes in the currently selected rule
function updateInventoryRules() {
  inventoryRules.value.map((rule: Rule) => {
    if(rule.routingRuleId === selectedRoutingRule.value.routingRuleId) {
      rule = {
        ...rule,
        ...selectedRoutingRule.value
      }
    }
  })
}

function updateRuleStatus(statusId: string) {
  selectedRoutingRule.value.statusId = statusId
  updateInventoryRules()
}

function doRouteSortReorder(event: CustomEvent) {
  const previousSeq = JSON.parse(JSON.stringify(Object.values(orderRoutingFilters.value["ENTCT_SORT_BY"])))

  // returns the updated sequence after reordering
  const updatedSeq = event.detail.complete(JSON.parse(JSON.stringify(Object.values(orderRoutingFilters.value["ENTCT_SORT_BY"]))));

  const updatedSeqenceNum = Object.keys(previousSeq).map((filter: any) => previousSeq[filter].sequenceNum)
  Object.keys(updatedSeq).map((key: any, index: number) => {
    updatedSeq[key].sequenceNum = updatedSeqenceNum[index]
  })

  orderRoutingFilters.value["ENTCT_SORT_BY"] = updatedSeq.reduce((filters: any, filter: any) => {
    filters[filter.fieldName] = filter
    return filters
  }, {})

  Object.keys(orderRoutingFilters.value["ENTCT_SORT_BY"]).map((key: string) => {
    const isSeqChanged = currentRouting.value["orderFilters"]["ENTCT_SORT_BY"][key] ? isObjectUpdated(JSON.parse(JSON.stringify(currentRouting.value["orderFilters"]))["ENTCT_SORT_BY"][key], orderRoutingFilters.value["ENTCT_SORT_BY"]?.[key]) : false
    if(isSeqChanged) {
      orderRoutingFilters.value["ENTCT_SORT_BY"][key].method = "UPDATE"
    } else if(currentRouting.value["orderFilters"]["ENTCT_SORT_BY"][key]) {
      // Remove method from the object as there is no change in the object
      delete orderRoutingFilters.value["ENTCT_SORT_BY"][key].method
    }
  })
}

function doConditionSortReorder(event: CustomEvent) {
  const previousSeq = JSON.parse(JSON.stringify(Object.values(inventoryRuleConditions.value["ENTCT_SORT_BY"])))

  // returns the updated sequence after reordering
  const updatedSeq = event.detail.complete(JSON.parse(JSON.stringify(Object.values(inventoryRuleConditions.value["ENTCT_SORT_BY"]))));

  const updatedSeqenceNum = Object.keys(previousSeq).map((filter: any) => previousSeq[filter].sequenceNum)
  Object.keys(updatedSeq).map((key: any, index: number) => {
    updatedSeq[key].sequenceNum = updatedSeqenceNum[index]
  })

  inventoryRuleConditions.value["ENTCT_SORT_BY"] = updatedSeq.reduce((filters: any, filter: any) => {
    filters[filter.fieldName] = filter
    return filters
  }, {})

  Object.keys(inventoryRuleConditions.value["ENTCT_SORT_BY"]).map((key: string) => {
    const isSeqChanged = inventoryRulesInformation.value[selectedRoutingRule.value.routingRuleId]["inventoryFilters"]["ENTCT_SORT_BY"][key] ? isObjectUpdated(inventoryRulesInformation.value[selectedRoutingRule.value.routingRuleId]["inventoryFilters"]["ENTCT_SORT_BY"][key], inventoryRuleConditions.value["ENTCT_SORT_BY"]?.[key]) : false
    if(isSeqChanged) {
      inventoryRuleConditions.value["ENTCT_SORT_BY"][key].method = "UPDATE"
    } else if(inventoryRulesInformation.value[selectedRoutingRule.value.routingRuleId]["inventoryFilters"]["ENTCT_SORT_BY"][key]) {
      // Remove method from the object as there is no change in the object
      delete inventoryRuleConditions.value["ENTCT_SORT_BY"][key].method
    }
  })
  updateRuleInformation()
}

function findRoutingsDiff(previousSeq: any, updatedSeq: any) {
  const diffSeq: any = Object.keys(previousSeq).reduce((diff, key) => {
    if (updatedSeq[key].routingRuleId === previousSeq[key].routingRuleId && updatedSeq[key].statusId === previousSeq[key].statusId && updatedSeq[key].assignmentEnumId === previousSeq[key].assignmentEnumId) return diff
    return {
      ...diff,
      [key]: updatedSeq[key]
    }
  }, {})
  return diffSeq;
}

function doReorder(event: CustomEvent) {
  // returns the updated sequence after reordering
  const updatedSeq = event.detail.complete(JSON.parse(JSON.stringify(inventoryRules.value)));
  inventoryRules.value = updatedSeq
  // Not updating the sequenceNum for the updated rules, as the reordering of rules can happen multiple times without saving, hence updating the rules sequenceNum only on saving
}

// checks whether values for all the properties of two objects are same
function isObjectUpdated(initialObj: any, finalObj: any) {
  return !Object.keys(initialObj).every((key: string) => {
    if(typeof key !== 'string') {
      return JSON.stringify(finalObj[key]) === JSON.stringify(initialObj[key])
    }
    return finalObj[key] === initialObj[key]
  })
}

async function save() {
  const valueRequiredForRouteFilter = "ENTCT_FILTER"
  const filtersToRemove = [] as any
  const conditionTypes = Object.keys(enums.value["CONDITION_TYPE"])
  const fieldToRemoveBeforeUpdate = ["method", "lastUpdatedStamp", "_entity", "createdDate"]

  const routing = {
    orderRoutingId: currentRouting.value["orderRoutingId"],
    routingGroupId: currentRouting.value["routingGroupId"],
  } as any

  // Find diff for inventory rules
  let diffSeq = findRoutingsDiff(currentRouting.value["rules"], inventoryRules.value)

  const updatedSeqenceNum = currentRouting.value["rules"].map((rule: Rule) => rule.sequenceNum)
  Object.keys(diffSeq).map((key: any) => {
    diffSeq[key].sequenceNum = updatedSeqenceNum[key]
  })

  diffSeq = Object.keys(diffSeq).map((key) => diffSeq[key])

  if(diffSeq.length) {
    routing["rules"] = diffSeq
  }
  // Inventory rules diff calculated

  // Prepare routeFilter to update, delete and create
  conditionTypes.map((filterType: string) => {
    if(orderRoutingFilters.value[filterType]) {
      Object.keys(orderRoutingFilters.value[filterType]).map((key: string) => {
        console.log('orderRoutingFilters.value[filterType][key]', orderRoutingFilters.value[filterType][key])
        // When there is no change in filter, method property won't exist and thus do not do anything
        if(!orderRoutingFilters.value[filterType][key]?.method) {
          return;
        }

        // If method property is DELETE then remove, then add the filter to removes array
        if(orderRoutingFilters.value[filterType][key]["method"] === "DELETE") {
          filtersToRemove.push(JSON.parse(JSON.stringify(currentRouting.value["orderFilters"]))[filterType][key])
        } else {
          const method = orderRoutingFilters.value[filterType][key]["method"]

          // prepare routeFilter values by removing some of the properties those we don't need to send in the update request
          const routeFilter = Object.keys(orderRoutingFilters.value[filterType][key]).reduce((filter: any, param: string) => {
            if(fieldToRemoveBeforeUpdate.includes(param)) {
              return filter;
            }
            filter[param] = orderRoutingFilters.value[filterType][key][param]
            return filter
          }, {})

          // We need to send createdDate when creating a new filter
          if(method === "CREATE") {
            routeFilter["createdDate"] = DateTime.now().toMillis()
          }

          // Not include the filter in update when fieldValue is missing for specific type of filter `ENTCT_FILTER`, added check for 0 as we have some filters in which user can pass 0 as its value
          if(filterType === valueRequiredForRouteFilter && !(routeFilter.fieldValue || routeFilter.fieldValue === 0)) {
            return;
          }

          if(routing["orderFilters"]) {
            routing["orderFilters"].push(routeFilter)
          } else {
            routing["orderFilters"] = [routeFilter]
          }
        }
      })
    }
  })
  // Route filters array prepared

  const conditionsToRemove = [] as any

  // conditionTypes.map((filterType: string) => {
  //   if(inventoryRuleConditions.value["inventoryFilters"][filterType]) {
  //     Object.keys(inventoryRuleConditions.value["inventoryFilters"][filterType]).map((key: string) => {
  //       if(ruleConditions.value(selectedRoutingRule.value.routingRuleId)[filterType]?.[key]) {
  //         const isSeqChanged = isObjectUpdated(ruleConditions.value(selectedRoutingRule.value.routingRuleId)[filterType][key], inventoryRuleConditions.value["inventoryFilters"][filterType]?.[key])
  //         if(isSeqChanged) {
  //           // Expanding object, as when the filter which is updated needs to use the values from original object, but if there is some change in the latest object(like seqNum due to reordering) then needs to override it
  //           conditionsToUpdate.push({
  //             ...ruleConditions.value(selectedRoutingRule.value.routingRuleId)[filterType][key],
  //             ...inventoryRuleConditions.value["inventoryFilters"][filterType][key]
  //           })
  //         }
  //       } else {
  //         // Added check for 0, as when applying safetyStock filter the value can be zero
  //         if(filterType === valueRequiredForRouteFilter && (inventoryRuleConditions.value["inventoryFilters"][filterType][key]?.["fieldValue"] || inventoryRuleConditions.value["inventoryFilters"][filterType][key]?.["fieldValue"] == 0)) {
  //           conditionsToCreate.push(inventoryRuleConditions.value["inventoryFilters"][filterType][key])
  //         } else if(filterType !== valueRequiredForRouteFilter) {
  //           conditionsToCreate.push(inventoryRuleConditions.value["inventoryFilters"][filterType][key])
  //         }
  //       }
  //     })
  //   }

  //   if(ruleConditions.value(selectedRoutingRule.value.routingRuleId)[filterType]) {
  //     Object.keys(ruleConditions.value(selectedRoutingRule.value.routingRuleId)[filterType]).map((key: string) => {
  //       if(!inventoryRuleConditions.value["inventoryFilters"][filterType]?.[key]) {
  //         conditionsToRemove.push(ruleConditions.value(selectedRoutingRule.value.routingRuleId)[filterType][key])
  //       }
  //     })
  //   }
  // })

  // If there are some filters those needs to be removed then only call the delete api
  // if(filtersToRemove.length) {
  //   await store.dispatch("orderRouting/deleteRoutingFilters", { filters: filtersToRemove, orderRoutingId: props.orderRoutingId })
  // }

  console.log('filtersToRemove', filtersToRemove)
  console.log('routing', routing)

  // Call update api only when there is some change in the rules or orderFilters array
  // if(routing["rules"]?.length || routing["orderFilters"].length) {
  //   await store.dispatch("orderRouting/updateOrderRoutingInformation", routing)
  // }

  // if(conditionsToRemove.length) {
  //   await store.dispatch("orderRouting/deleteRuleConditions", { conditions: conditionsToRemove, routingRuleId: selectedRoutingRule.value.routingRuleId })
  // }
}
</script>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: repeat(2, auto);
}

.actions {
  max-width: 50%;
}

ion-content > div {
  display: grid;
  grid-template-columns: 300px 300px 1fr;
  height: 100%;
}

ion-content > div > .menu {
  border-right: 1px solid #92949C;
  justify-content: center;
}

ion-chip > ion-select {
  /* Adding min-height as auto-styling is getting appLied when not using legacy select option */
  min-height: unset;
}
</style>
