export let officalLogicList = [
  "LCAPGetResourcesByPermissionId",
  "LCAPLoadPerManagementTableView",
  "LCAPGetLAllACPPermission",
  "LCAPGetPerResMappingByPermissionId",
  "LCAPGetPermissionResourceRelated",
  "LCAPGetPermissionResourseNotRelated",
  "LCAPIsUserNameRepeated",
  "LCAPLoadAddRolePermissionTableView",
  "LCAPGetMappingByRoleIdAndPermissionId",
  "LCAPUser_Create",
  "LCAPGetUserList",
  "LCAPGetUserByUserId",
  "LCAPGetAllUsers",
  "LCAPGetUserTableView",
  "LCAPIsExistRoleId",
  "LCAPLoadPermissionResourceListView",
  "LCAPGetMappingByPermissionIdAndResourceId",
  "LCAPGetScopeResourceByRoleId",
  "loadAddRoleUserTableView",
  "LCAPGetRoleBindUserList",
  "LCAPLoadRoleManagementTableView",
  "LCAPLoadUserRoleMappingTableView",
  "LCAPGetRolePermissionList",
  "LCAPGetUserResources",
  "LCAPGetPermissionByRoleId",
  "LCAPGetMappingIdByRoleIdAndUserId",
  "LCAPIsAlreadBindUserIdList",
  "LCAPLoadResourceTableView",
  "LCAPIsRoleNameRepeated"
]
const officalEntityMap: any = {
  LCAPUser: ['id', 'createdTime', 'updatedTime', 'userId', 'userName', 'password', 'phone', 'email', 'displayName', 'status', 'source'],
  LCAPLogicViewMapping: ['id', 'logicIdentifier', 'resourceName', 'resourceType', 'group', 'changeTime'],
  LCAPRolePerMapping: ['id', 'createdTime', 'updatedTime', 'createdBy', 'updatedBy', 'roleId', 'permissionId'],
  LCAPPerResMapping: ['id', 'createdTime', 'updatedTime', 'createdBy', 'updatedBy', 'permissionId', 'resourceId'],
  LCAPUserRoleMapping: ['id', 'createdTime', 'updatedTime', 'createdBy', 'updatedBy', 'userId', 'roleId', 'userName', 'source'],
  LCAPRole: ['id', 'createdTime', 'updatedTime', 'createdBy', 'updatedBy', 'uuid', 'name', 'description', 'roleStatus', 'editable'],
  LCAPPermission: ['id', 'createdTime', 'updatedTime', 'createdBy', 'updatedBy', 'uuid', 'name', 'description'],
  LCAPResource: ['id', 'createdTime', 'updatedTime', 'createdBy', 'updatedBy', 'uuid', 'name', 'description', 'type', 'clientType'],
  LCAPUserDeptMapping:['id', 'createdTime', 'updatedTime', 'createdBy', 'updatedBy', 'userId', 'deptId', 'isDeptLeader'],
  LCAPDepartment: ['id', 'createdTime', 'updatedTime', 'createdBy', 'updatedBy', 'name', 'deptId', 'parentDeptId'],
}

let officalLoginEnties = ['LCAPAppCache','LCAPThirdIdentity','LCAPAppConfig','LCAPIdentitySourceConfig']

export let entityList = Object.keys(officalEntityMap)
export let officalEntityList37 = entityList.filter(it => it !== "LCAPLogicViewMapping")
export function isOfficalEntity(entityProperty: any) {
  let epNode = entityProperty?.naslNode
  if (entityList.includes(epNode?.parentNode?.name)) {
    return true
  }
  return false
}
export function isOfficalEntityProperty(entityProperty: any) {
  let epNode = entityProperty?.naslNode
  if (entityList.includes(epNode?.parentNode?.name)) {
    let entityPropertyList = officalEntityMap[epNode?.parentNode?.name]
    if (entityPropertyList.includes(epNode.name)) {
      return true
    }
    return false
  }
  return false
}

const officalEnumMap: any = {
  UserSourceEnum: ['Normal'],
  UserStatusEnum: ['Normal', 'Forbidden',],
}
export let enumList = Object.keys(officalEnumMap)
export function isOfficalEnum(entityProperty: any) {
  let epNode = entityProperty?.naslNode
  return enumList.includes(epNode?.parentNode?.name)
}
export function isOfficalEnumProperty(entityProperty: any) {
  let epNode = entityProperty?.naslNode
  if (enumList.includes(epNode?.parentNode?.name)) {
    let entityPropertyList = officalEnumMap[epNode?.parentNode?.name]
    return entityPropertyList.includes(epNode.value)
  }
  return false
}


const officalStructMap: any = {
  LCAPGetResourceResult: ['resourceValue', 'resourceType'],
  LCAPPostRequest: ['response', 'status', 'requestInfo'],
}
export let structList = Object.keys(officalStructMap)
export function isOfficalStruct(entityProperty: any) {
  let epNode = entityProperty?.naslNode
  return structList.includes(epNode?.parentNode?.name)
}
export function isOfficalStructProperty(entityProperty: any) {
  let epNode = entityProperty?.naslNode
  if (structList.includes(epNode?.parentNode?.name)) {
    let entityPropertyList = officalStructMap[epNode?.parentNode?.name]
    return entityPropertyList.includes(epNode.name)
  }
  return false
}


export function checkPermissTemplate(app: any) {
  if(app.hasOwnProperty('hasAuth')&& !app.hasAuth &&  app.hasAuth !== null){
    return true
  }
  let isPermissTemplate = false
  const isEmptyLogic = (logic: any) => logic.body?.filter((node: any) => !['Start', 'End', 'Comment'].includes(node?.concept))?.length <= 0;
  // 规则二选一 1 有两个特定的依赖库的复写逻辑   2 有Lcap开头的实体
  let entities = app?.entities || app?.dataSources.find((it: any) => it.name === 'defaultDS')?.entities
  entities = entities
  ?.filter((it:any) => it.name !== "LCAPLogicViewMapping")
  let hasPermissonEntity = entities?.find((entity: any) => entity.name.startsWith('LCAP'))
  if (hasPermissonEntity) {
    const pcFrontendType = app?.frontendTypes.find(it=>it.kind === 'pc');
    if (pcFrontendType?.frameworkKind === 'react') {
      entities = entities.filter((it:any) => it.name.startsWith("LCAP"));
      if(entities.length === 1 && entities[0].name === "LCAPUser"){
        hasPermissonEntity = false;
      }
    }
  }
  let permissonDep = app?.dependencies?.find((dep: any) => dep.name === 'lcap_permission')
  let hasPermissonLogic = false
  if (permissonDep) {
    let checkPermissionLogic = permissonDep.logics.find((it: any) => it.name === 'checkPermission')
    let getUserResourcesLogic = permissonDep.logics.find((it: any) => it.name === 'getUserResources')
    let overCheckPermissionLogic = checkPermissionLogic && app.overriddenLogics.find((it: any) => it.name === 'checkPermission') || false
    let overGetUserResourcesLogic = getUserResourcesLogic && app.overriddenLogics.find((it: any) => it.name === 'getUserResources') || false
    if (overCheckPermissionLogic && overGetUserResourcesLogic) {
      hasPermissonLogic = !isEmptyLogic(overCheckPermissionLogic) && !isEmptyLogic(overGetUserResourcesLogic)
    }
  }
  if (hasPermissonEntity || hasPermissonLogic) {
    isPermissTemplate = true
  }
  return isPermissTemplate
}
export function checkDeptTemplate(app: any) {
  let isPermissTemplate = false
  const isEmptyLogic = (logic: any) => logic.body?.filter((node: any) => !['Start', 'End', 'Comment'].includes(node?.concept))?.length <= 0;
  // 规则二选一 1 有特定的依赖库的复写逻辑lcap_user.getDeptUsers   2 有LCAPDepartment实体
  let entities = app?.entities || app?.dataSources.find((it: any) => it.name === 'defaultDS')?.entities
  let hasDeptEntity = entities
    ?.find((entity: any) => entity.name === 'LCAPDepartment')
  let permissonDep = app?.dependencies?.find((dep: any) => dep.name === 'lcap_user')
  let hasPermissonLogic = false
  if (permissonDep) {
    let checkLogic = permissonDep.logics.find((it: any) => it.name === 'getDeptUsers')
    let overCheckLogic = checkLogic && app.overriddenLogics.find((it: any) => it.name === 'getDeptUsers') || false
    if (overCheckLogic ) {
      hasPermissonLogic = !isEmptyLogic(overCheckLogic)
    }
  }
  if (hasDeptEntity || hasPermissonLogic) {
    isPermissTemplate = true
  }
  return isPermissTemplate
}

export function checkOfficalPermissTemplate(app: any) {
  let defaultDS = app.dataSources.find((ds: any) => ds.name === 'defaultDS')
  let appEntityList = defaultDS?.entities?.map((it: any) => it.name) ?? []
  return officalEntityList37.every((entity: any) => appEntityList.includes(entity))
}

export function checkOfficalPermissAuthTemplate(app: any) {
  let defaultDS = app.dataSources.find((ds: any) => ds.name === 'defaultDS')
  let appEntityList = defaultDS?.entities?.map((it: any) => it.name) ?? []
  let permissonOk  = officalEntityList37.every((entity: any) => appEntityList.includes(entity))
  let loginOk =  officalLoginEnties.every((entity: any) => appEntityList.includes(entity))
  return permissonOk && loginOk
}
