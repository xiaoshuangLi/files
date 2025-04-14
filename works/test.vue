<template>
  <div>
    <div v-if="!isViewEntity" class="topIconGroup" :class="$style.body" style="margin-top: 0px ; margin-bottom: 0px ; border-bottom:0px ">
      <!-- 添加实体属性 -->
      <s-others-icon name="add" tooltip="添加属性" button @click="addItem"> </s-others-icon>
      <!-- 删除实体属性 -->
      <s-others-icon
        name="remove"
        button
        :tooltip="getRemoveTooltip()"
        :disabled="
          !selectedItem || !selectedItem.naslNode
          || selectedItem.loading
          || selectedItem.naslNode.primaryKey
          || isOfficalEntityProperty(selectedItem)
        "
        @click="removeItem(selectedItem)"
      >
      </s-others-icon>
      <div :class="$style.icondivider">|</div>
      <!-- 上移实体属性 -->
      <s-others-icon
        name="position-up"
        button
        :tooltip="
          !selectedItem ||
          !selectedItem.naslNode ||
          selectedItem.loading ||
          renderList[0].naslNode.name === selectedItem.naslNode.name
            ? '当前属性已置顶'
            : '上移'
        "
        :disabled="
          !selectedItem ||
          !selectedItem.naslNode ||
          selectedItem.loading ||
          renderList[0].naslNode.name === selectedItem.naslNode.name
        "
        @click="moveUpItem"
      >
      </s-others-icon>
      <!-- 下移实体属性 -->
      <s-others-icon
        name="position-down"
        button
        :tooltip="
          !selectedItem ||
          !selectedItem.naslNode ||
          selectedItem.loading ||
          renderList[renderList.length - 1].naslNode.name === selectedItem.naslNode.name
            ? '当前属性已置底'
            : '下移'
        "
        :disabled="
          !selectedItem ||
          !selectedItem.naslNode ||
          selectedItem.loading ||
          renderList[renderList.length - 1].naslNode.name === selectedItem.naslNode.name
        "
        @click="moveDownItem"
      >
      </s-others-icon>
    </div>
    <div :class="$style.body" style="margin-top: 0px" >
    <div :class="$style.bodywrap" class="tableCell">
      <el-table
        ref="tableviewRef"
        :data="renderList"
        highlight-current-row
        :style="`min-width:950px;${tableHeight}`"
        style="width:100%"
        :class="
          renderList.length > 8
            ? [$style.table, $style.tablescroll, 's-data-table-edit']
            : [$style.table, 's-data-table-edit']
        "
        :value="selectedItem && selectedItem.naslNode.name"
        value-field="name"
        :header-row-style="{ height: '40px' }"
        :cell-style="{ padding: '0px' }"
        :row-style="{ height: '42px' }"
        :row-class-name="setRowClassName"
        empty-text="暂无数据"
        @row-contextmenu="onContextMenuRow"
        @row-click="onSelectRowWithDataType"
        @header-dragend="handleDragend"
        @click.right.prevent
        :border="true"
      >
        <!-- 主键/关联属性的icon -->
        <el-table-column width="38" prop="primaryKey" :resizable="false">
          <template #default="{ row: item, $index }">
            <template v-if="$index === -1" />
            <template v-else>
              <s-others-icon
                v-if="item.naslNode.primaryKey"
                name="key"
                :class="[$style.iconBase, $style.iconKey]"
              >
              </s-others-icon>
              <s-others-icon
                v-if="item.naslNode.relationProperty"
                name="link"
                :class="[$style.iconBase, $style.iconLink]"
              >
              </s-others-icon>
            </template>
          </template>
        </el-table-column>
        <!-- 名称 -->
        <el-table-column label="名称" prop="name" min-width="87">
          <template #header  >
            <div class="theadLable" >
              名称
            </div>
          </template>
          <template #default="{ row: item, $index }">
            <template v-if="$index === -1" />
            <!-- 非禁用状态 -->
            <template v-else-if="!getDisable(item)">
              <!-- 展示态 -->
              <div
                v-if="item.edit !== 'name'"
                tabindex="0"
                :class="$style.edit"
                :title="item.naslNode.name"
                @dblclick="onSetItemEdit(item, 'name', true)"
                @keyup="onKeyUp($event, item, 'name')"
              >
                <div :class="$style.text">
                  <span :class="$style.textContent">{{ item.naslNode.name }}</span>
                  <s-others-icon
                    name="edit"
                    :class="[$style.iconBase, $style.iconEdit]"
                    @click="onSetItemEdit(item, 'name', true)"
                  >
                  </s-others-icon>
                </div>
              </div>
              <!-- 编辑态 -->
              <div v-else :class="$style.editwrap">
                <!-- value 传入的是被验证的值 -->
                <!-- validate-result 来调整 是否存在非法项 -->
                <u-validator
                  v-slot="slotProps"
                  :value="item.naslNode.name"
                  :rules="getEntityPropertyRules(item.naslNode)"
                  :class="$style.validator"
                  error-display="appear"
                  error-append-to-body
                  @blur-valid="onBlurName(item, $event.value)"
                  @blur-invalid="errorScrollIntoView"
                  @validate-result="hasInvalid = !$event.valid"
                >
                  <!-- “属性名”为空是显示提示信息 -->
                  <el-tooltip
                    :visible="tooltipOpened === 'entityAttribute' && !itemNameValue"
                    placement="top-start"
                    content="属性为英文字母、数字和下划线，且首字母小写"
                  >
                    <s-input
                      :placeholder="entityPropertyPlaceholder"
                      :model-value="item.naslNode.name"
                      ref="nameEditor"
                      :class="$style.input"
                      @focus="onFocusName(item)"
                      @blur:value="slotProps.blurFn($event)"
                      @input="slotProps.inputChange($event)"
                      @keyup.enter="$event.target.blur()"
                      @update:modelValue="itemNameValue = $event"
                    >
                    </s-input>
                  </el-tooltip>
                </u-validator>
              </div>
            </template>
            <!-- 禁用状态 -->
            <div v-else :class="$style.text">
              <span>{{ item.naslNode.name }}</span>
            </div>
          </template>
        </el-table-column>
        <!-- 标题 -->
        <el-table-column  prop="label" min-width="87" label="标题">
          <template #header  >
            <div class="theadLable">
              标题
            </div>
          </template>
          <template #default="{ row: item, $index }">
            <template v-if="$index === -1" />
            <!-- 非禁用状态 -->
            <template v-else-if="!item.loading && !item.naslNode.parentNode.loading && !isViewEntity">
              <!-- 展示态 -->
              <div
                v-if="item.edit !== 'label'"
                :class="$style.edit"
                @dblclick="onSetItemEdit(item, 'label', true)"
                tabindex="0"
                @keyup="onKeyUp($event, item, 'label')"
                :title="item.naslNode.label"
              >
                <div :class="$style.text">
                  <span :class="$style.textContent">{{ item.naslNode.label }}</span>
                  <s-others-icon
                    v-show="!isOfficalEntityProperty(item)"
                    name="edit"
                    :class="[$style.iconBase, $style.iconEdit]"
                    @click="onSetItemEdit(item, 'label', true)"
                  >
                  </s-others-icon>
                </div>
              </div>
              <!-- 编辑态 -->
              <div v-else :class="$style.editwrap">
                <!-- value 传入的是被验证的值 -->
                <!-- validate-result 来调整 是否存在非法项 -->
                <u-validator
                  v-slot="slotProps"
                  :value="item.naslNode.label"
                  rules="maxLength(63)"
                  :class="$style.validator"
                  error-display="appear"
                  error-append-to-body
                  @blur-valid="onBlurLabel(item, $event.value)"
                  @blur-invalid="errorScrollIntoView"
                  @validate-result="hasInvalid = !$event.valid"
                >
                  <s-input
                    placeholder="请输入标题"
                    :model-value="item.naslNode.label"
                    ref="labelEditor"
                    :class="$style.input"
                    @blur:value="slotProps.blurFn($event)"
                    @input="slotProps.inputChange($event)"
                    @keyup.enter="$event.target.blur()"
                  >
                  </s-input>
                </u-validator>
              </div>
            </template>
            <!-- 禁用状态 -->
            <div v-else :class="$style.text">
              <!-- 之前仅仅为 item.label 但是实际上在item 对象中没有label属性，恐在特殊情况下存在，故范围限制为 区分 viewEntity -->
              <span>{{ isViewEntity ? item.naslNode.label : item.label }}</span>
            </div>
          </template>
        </el-table-column>
        <!-- 数据类型 -->
        <el-table-column label="数据类型" min-width="247">
          <template #header  >
            <div class="theadLable">
              数据类型
            </div>
          </template>
          <template #default="{ row: item, $index }">
            <template v-if="$index === -1" />
            <template v-else>
              <el-tooltip
                v-if="isAppDeploying"
                content="应用发布中，暂不能修改"
                placement="bottom-start"
              >
                <div :class="$style.text">
                  <span>{{ showDatatype(item) }}</span>
                </div>
              </el-tooltip>
              <!-- 禁用状态 / 已经发布过的复合类型 -->
              <template v-else-if="getDisable(item) || isPublishedComplexType(item)">
                <div :class="$style.text">
                  <span>{{ showDatatype(item) }}</span>
                </div>
              </template>
              <!-- 非禁用状态 -->
              <template v-else>
                <!-- 展示态 -->
                <div
                  v-if="item.edit !== 'datatype'"
                  tabindex="0"
                  :class="$style.edit"
                  :ref="`datatype${item.naslNode.id}`"
                  :title="showDatatype(item)"
                  @dblclick="onDblClickDatatype(item, $event)"
                  @keyup="onKeyUp($event, item, 'datatype')"
                >
                  <div :class="$style.text">
                    <span :class="$style.textContent">{{ showDatatype(item) }}</span>
                    <s-others-icon
                      name="edit"
                      :class="[$style.iconBase, $style.iconEdit]"
                      @click="getDataTypeList(), onSetItemEdit(item, 'datatype', false)"
                    >
                    </s-others-icon>
                  </div>
                </div>
                <!-- 编辑态 -->
                <div v-else :class="$style.editwrap">
                  <el-tooltip
                    :content="`${isAppDeploying ? '应用发布中，暂不能修改' : ''}`"
                    placement="bottom-start"
                  >
                    <s-datatype-select
                      :unionable="false"
                      :no-union-subtype="true"
                      :data-type-list="item.naslNode.lastVersion ? dataTypeList : undefined"
                      :last-version="item.naslNode.lastVersion"
                      :type-annotation="item.naslNode.typeAnnotation"
                      :concept="item.naslNode.entity.concept"
                      :show-system-types="false"
                      :show-generic-types="true"
                      :show-entity="true"
                      :show-structures="true"
                      :emptyable="false"
                      :hasAnonymousStructure="true"
                      :disabled="
                        item.naslNode.readonly || isAppDeploying || isPublishedComplexType(item)
                      "
                      @blur="handleBlur(item)"
                      @change="onChangeDatatype"
                    >
                    </s-datatype-select>
                  </el-tooltip>
                </div>
              </template>
            </template>
          </template>
        </el-table-column>
        <!-- 是否必填 -->
        <el-table-column label="是否必填" width="70" prop="required" :resizable="false">
          <template #default="{ row: item, $index }">
            <template v-if="$index === -1" />
            <div v-else style="margin-left: 16px">
              <el-checkbox
                v-model="item.naslNode.required"
                :disabled="getDisable(item) || isComplexType(item) || isOfficalEntity(item)"
                :tabindex="
                  item.editable === false || item.loading || item.naslNode.parentNode.loading ? -1 : 0
                "
                :class="$style.checkbox"
                @change="requireInput(item, $event)"
              >
              </el-checkbox>
            </div>
          </template>
        </el-table-column>
        <!-- 默认值 -->
        <el-table-column label="默认值" prop="defaultValue" width="120" :resizable="false">
          <template #default="{ row: item }">
            <div
              v-if="['createdTime', 'updatedTime'].includes(item.naslNode.name)"
              :class="$style.text"
            >
              <span>自动生成</span>
            </div>
            <div
              v-else-if="['createdBy', 'updatedBy'].includes(item.naslNode.name)"
              :class="$style.text"
            >
              <span>（无）</span>
            </div>
            <template v-else-if="!canSetDefaultValue(item)">
              <div :class="$style.text"><span>（无）</span></div>
            </template>
            <template
              v-else-if="
                item.loading ||
                item.naslNode.parentNode.loading ||
                item.naslNode.generationRule !== 'manual'
              "
            >
              <div :class="$style.text">
                <div :class="$style.text" v-if="item.naslNode.generationRule === 'auto'">
                  <span>自动生成</span>
                </div>
                <span v-else>{{ item.naslNode.defaultValue }}</span>
              </div>
            </template>
            <template v-else>
              <s-attr-input
                title="默认值绑定"
                node-concept="defaultValue"
                :name="item.naslNode.name"
                :parent-node="item.naslNode"
                :node="item.naslNode.defaultValue"
                :class="{ [$style.typeError]: IsError(item.naslNode) }"
              ></s-attr-input>
            </template>
          </template>
        </el-table-column>
        <!-- 显示在表格 -->
        <el-table-column width="100" prop="display.inTable" :resizable="false">
          <template #header>
            <el-checkbox label="显示在表格"
              :class="$style.checkbolabel"
              :model-value="inTable"
              @change="toggleSelectAll($event,'inTable')"
              >
            </el-checkbox>
          </template>
          <template #default="{ row: item, $index }">
            <template v-if="$index === -1" />
            <div v-else :data-item-id="item.id">
              <el-checkbox
                :model-value="item.naslNode.display.inTable"
                :disabled="item.loading || item.naslNode.parentNode.loading"
                :class="$style.checkbox"
                @change="setDisplay(item, $event, 'inTable')"
              >
              </el-checkbox>
            </div>
          </template>
        </el-table-column>
        <!-- 显示在筛选 -->
        <el-table-column  width="100" prop="display.inFilter" :resizable="false">
          <template #header>
            <el-checkbox label="显示在筛选"
              :class="$style.checkbolabel"
              :model-value="inFilter"
              @change="toggleSelectAll($event,'inFilter')"
              >
            </el-checkbox>
          </template>
          <template #default="{ row: item, $index }">
            <template v-if="$index === -1" />
            <div v-else :data-item-id="item.id">
              <el-checkbox
                :model-value="item.naslNode.display.inFilter"
                :disabled="item.loading || item.naslNode.parentNode.loading || isComplexType(item)"
                :class="$style.checkbox"
                @change="setDisplay(item, $event, 'inFilter')"
              >
              </el-checkbox>
            </div>
          </template>
        </el-table-column>
        <!-- 显示在表单 -->
        <el-table-column width="100" prop="display.inForm" :resizable="false">
          <template #header>
            <el-checkbox label="显示在表单"
              :class="$style.checkbolabel"
              :model-value="inForm"
              @change="toggleSelectAll($event,'inForm')"
              >
            </el-checkbox>
          </template>
          <template #default="{ row: item, $index }">
            <template v-if="$index === -1" />
            <div v-else :data-item-id="item.id">
              <el-checkbox
                :model-value="item.naslNode.display.inForm"
                :class="$style.checkbox"
                :disabled="item.loading || item.naslNode.parentNode.loading || isComplexType(item)"
                @change="setDisplay(item, $event, 'inForm')"
              >
              </el-checkbox>
            </div>
          </template>
        </el-table-column>
        <!-- 显示在详情 -->
        <el-table-column width="100" prop="display.inDetail" :resizable="false">
          <template #header>
            <el-checkbox label="显示在详情"
              :class="$style.checkbolabel"
              :model-value="inDetail"
              @change="toggleSelectAll($event,'inDetail')"
              >
            </el-checkbox>
          </template>
          <template #default="{ row: item, $index }">
            <template v-if="$index === -1" />
            <div v-else :data-item-id="item.id">
              <el-checkbox
                :model-value="item.naslNode.display.inDetail"
                :disabled="item.loading || item.naslNode.parentNode.loading"
                :class="$style.checkbox"
                @change="setDisplay(item, $event, 'inDetail')"
              >
              </el-checkbox>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <!-- 右键点击 -->
      <el-popover
        :disabled-scroll="true"
        trigger="click"
        ref="menuPopper"
        :popper-options="popperOptions"
        v-if="menuSelectedItem && popperExistMap[menuSelectedItem.id]"
        v-model:visible="popperVisibleMap[menuSelectedItem && menuSelectedItem.id]"
        :virtual-ref="triggerRef"
        :placement="placement"
        :show-arrow="false"
        @hide="onMenuPopperHide"
      >
        <el-menu :class="$contextmenu.menu" @click="onMenuClick">
          <el-menu-item-group :class="$contextmenu.group" title="属性">
            <el-menu-item :class="$contextmenu.item" @click="onMenuFindUsage">查找引用</el-menu-item>
            <el-menu-item
              :class="$contextmenu.item"
              @click="onMenuDelete(removeItem)"
              :disabled="(menuSelectedItem && menuSelectedItem.primaryKey) || isOfficalEntityProperty({naslNode: menuSelectedItem}) || isViewEntity"
              >删除 </el-menu-item
            >
          </el-menu-item-group>
        </el-menu>
      </el-popover>
    </div>
    <template v-if="selectedItem">
      <div :class="[$style.flexgrid, $style.bodywrap1]">
        <div :class="$style.gridcolumn" class="extraForm">
          <el-form
            ref="selectedItemForm"
            :model="selectedItem"
            :class="[$style.reffrom, $style.blockFromLayout, 's-data-attr-designer-form']"
            label-width="85px"
            label-position="right"
            :inline="true"
          >
            <!-- 最 大/小 值/长度 -->
            <skeleton-render
              name="views/data/components/entity-field-rules/index"
              :property="selectedItem.naslNode"
              :key="'rules_' + selectedItem.naslNode.name"
              :disabled="
                selectedItem.loading ||
                selectedItem.naslNode.parentNode.loading ||
                selectedItem.naslNode.editable === false ||
                isViewEntity
              "
              :is-view-entity="isViewEntity"
              direction="horizontal"
              :class="$style.rules"
            />
            <!-- 小数位数 -->
            <el-form-item
              v-if="typeName === 'Decimal'"
              label="小数位数"
            >
              <el-input-number
                placeholder="请输入小数位数"
                :color="scaleErrorMsg ? 'error' : ''"
                v-model="model.scale"
                :min="scaleOption.min"
                :max="scaleOption.max"
                controls-position="right"
                :disabled="decimalDisabled(selectedItem) || isViewEntity"
                :value-on-clear="0"
                @keyup.enter="$event.target.blur()"
                @change="setScale"
              >
              </el-input-number>
              <div v-if="scaleErrorMsg" :class="$style.scaleErrorMsg">
                <s-others-icon name="solid-hint"></s-others-icon>
                {{ scaleErrorMsg }}
              </div>
            </el-form-item>
            <!-- 关联属性 -->
            <el-form-item :key="selectedItem.naslNode.name">
              <template #label>
                <div style="display: flex; align-items: center">
                  关联属性<s-others-icon name="link2" :class="$style.iconLink2"></s-others-icon>
                </div>
              </template>
              <skeleton-render
                name="views/data/entity-reference/index"
                :entity="entity"
                :property="selectedItem.naslNode"
                :value="entityReference"
                :disabled="selectedItem.loading || selectedItem.naslNode.parentNode.loading || isViewEntity"
                :data-type-list="selectedItem.naslNode.lastVersion ? dataTypeList : undefined"
                :error="isReleationEntityError(selectedItem.naslNode)"
                @save="onSaveReference"
                @clear="onClearReference"
              />
            </el-form-item>
            <!-- 属性记录 -->
            <el-form-item
              label="关联属性实体记录删除规则"
              v-if="selectedItem.naslNode.relationProperty"
              layout="block"
              class="relationDelRule"
            >
              <el-select style="width:240px;"
                v-model="selectedItem.naslNode.deleteRule"
                placeholder="请选择"
                :disabled="selectedItem.loading || selectedItem.naslNode.parentNode.loading || isViewEntity"
                @change="setDeleteRule"
              >
                <el-option label="不允许删除" value="protect"></el-option>
                <el-option label="允许删除且同时删除本实体记录" value="cascade"></el-option>
              </el-select>
            </el-form-item>
            <!-- 主键生成规则 -->
            <el-form-item
              v-if="selectedItem.naslNode.primaryKey"
              label="主键生成规则"
              placement="bottom"
            >
              <skeleton-render
                name="views/data/components/entity-primarykey-rules/index"
                :disabled="isViewEntity"
                :entity="entity"
                :selected-item="selectedItem.naslNode"
                @changeErrorMsgs="changeErrorMsgs"
              />
            </el-form-item>
            <!-- 数据库列名 -->
            <el-form-item label="数据库列名" placement="bottom">
              <u-validator
                style="width: 100%"
                :rules="entityPropertyColumnNameRules"
                :value="selectedItem.naslNode.columnName || selectedItem.naslNode.name"
                @blur-dirty-valid="selectedItem.naslNode.setColumnName($event.value)"
                v-slot="slotProps"
              >
                <s-input
                  :placeholder="entityPropertyColumnNamePlaceholder"
                  :model-value="selectedItem.naslNode.columnName || selectedItem.naslNode.name"
                  :disabled="isTableOrExcelOrigin || isViewEntity"
                  @change="slotProps.blurChange"
                  @input="slotProps.inputChange($event)"
                  @keyup.enter.stop="$event.target.blur()"
                ></s-input>
              </u-validator>
            </el-form-item>
            <!-- 描述 -->
            <el-form-item label="描述" prop="description">
              <u-validator
                v-slot="slotProps"
                :value="selectedItem.naslNode.description"
                rules="maxLength(63)"
                :class="$style.validator"
                @blur-valid="onBlurDescription(selectedItem, $event.value)"
                @blur-invalid="errorScrollIntoView"
                @validate-result="hasInvalid = !$event.valid"
              >
                <s-input
                  type="textarea"
                  ref="descriptionEditor"
                  placeholder="请输入描述"
                  :model-value="selectedItem.naslNode.description"
                  :disabled="selectedItem.loading || selectedItem.naslNode.parentNode.loading || isViewEntity"
                  @blur:value="slotProps.blurFn($event)"
                  @keyup.enter="slotProps.blurFn()"
                  @input="slotProps.inputChange($event)"
                >
                </s-input>
              </u-validator>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <div :class="$style.advancedWrap" v-if="showDatabasetype">
        <el-form :disabled="isViewEntity" label-width="80px" gap="small" class="s-data-attr-designer-form">
          <skeleton-render
            name="views/data/components/entity-property-databasetype/index"
            :property="selectedItem.naslNode"
          />
        </el-form>
      </div>
    </template>
    <div :class="$style.bodywrap1" v-show="errorMsgs.length || sourceSyncErrMsgs.length">
      <div v-for="errorMsg in errorMsgs" :key="errorMsg" :class="$propertyDesigner.errorMsg">
        <i :class="$propertyDesigner.infoicon"></i>
        <span>{{ errorMsg }}</span>
      </div>
      <!-- 实体在同步数据源时产生的错误信息 -->
      <div v-for="errorMsg in sourceSyncErrMsgs" :key="errorMsg" :class="$propertyDesigner.errorMsg">
        <i :class="$propertyDesigner.infoicon"></i>
        <span>{{ errorMsg }}</span>
      </div>
    </div>
    </div>
  </div>
</template>
