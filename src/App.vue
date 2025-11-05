<template>
  <div id="app">
    <div className="flow-editor">
      <!-- Header -->
      <div className="flow-header">
        <div className="app-logo-header">
          <img src="./assets/images/logo.svg" alt="FlowChart Studio" className="logo-image" />
        </div>
        <div className="header-info">
          <div className="header-time">{{ displayTime }}</div>
          <div className="header-filename">{{ displayFilename }}</div>
        </div>

      </div>

      <!-- Sidebar -->
      <div className="floating-sidebar">
        <button className="sidebar-header sidebar-btn" @click="openSetting">
          <img v-if="!isSetting" src="./assets/images/setting.svg" alt="setting" className="setting-icon" />
          <img v-if="isSetting" src="./assets/images/setting-active.svg" alt="setting" className="setting-active-icon" />
        </button>
        <div className="sidebar-divider"></div>
        <div className="sidebar-actions">
          <button className="sidebar-btn">
            <img src="./assets/images/menu-new.svg" alt="new" className="nav-icon" />
            <div v-if="!isSetting" className="hover-menu-container">
              <div className="hover-menu-list"> 
                <button className="hover-menu-btn" @click="handleNewFile">建立新檔</button>
              </div>
            </div>
          </button>
          <button className="sidebar-btn">
            <img src="./assets/images/menu-file.svg" alt="open" className="nav-icon" />
            <div v-if="!isSetting" className="hover-menu-container">
              <div className="hover-menu-list"> 
                <button className="hover-menu-btn" @click="handleSaveFile">儲存檔案</button>
                <button className="hover-menu-btn" @click="handleSaveAsFile">另存檔案</button>
                <button className="hover-menu-btn" @click="handleLoadFile">讀取檔案</button>
              </div>
            </div>
          </button>
          <button className="sidebar-btn">
            <img src="./assets/images/menu-pdf.svg" alt="pdf" className="nav-icon" />
            <div v-if="!isSetting" className="hover-menu-container">
              <div className="hover-menu-list"> 
                <button className="hover-menu-btn">單線圖</button>
              </div>
            </div>
          </button>
          <button className="sidebar-btn">
            <img src="./assets/images/menu-xlsx.svg" alt="xlsx" className="nav-icon" />
            <div v-if="!isSetting" className="hover-menu-container">
              <div className="hover-menu-list"> 
                <button className="hover-menu-btn" @click="handleExportHierarchy">Hierarchy</button>
                <button className="hover-menu-btn">聚賢料表</button>
                <button className="hover-menu-btn">台積料表</button>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Setting -->
      <Setting :isOpen="isSetting" :settings="settings" @close="closeSetting" @save="handleSaveSetting" />

      <!-- File Manager -->
      <FileManager
        :isOpen="isFileManagerOpen"
        :currentData="currentFlowchartData"
        :currentFilename="currentFilename"
        :currentFileId="currentFileId"
        ref="fileManagerRef"
        @close="closeFileManager"
        @save="handleFileManagerSave"
        @load="handleFileManagerLoad"
        @delete-file="handleFileManagerDelete"
      />

      <!-- Popup -->
      <Popup
        :visible="popupConfig.visible"
        :title="popupConfig.title"
        :message="popupConfig.message"
        :buttons="popupConfig.buttons"
        :showIcon="popupConfig.showIcon"
        :closeOnOverlay="popupConfig.closeOnOverlay"
        @close="closePopup"
        @button-click="handlePopupButtonClick"
      />

      <!-- Canvas -->
      <div className="flow-container">
        <VueZoomable 
          style="width: 100%; height: 100%;"
          :initialZoom="1"
          :wheelZoomStep="0.015"
          :minZoom="0.1"
          :maxZoom="3"
        >
          <div className="canvas-content">
            <ConnectionLine 
              :connections="lineConnections" 
              @additional-icon-click="handleAdditionalIconClick"
              @fa-icon-click="handleFaIconClick"
            />
            <div className="default-cards">
              <!-- 所有模組組都使用 v-for 生成 -->
              <template v-for="(moduleSet, setIndex) in allModuleSets" :key="`module-set-${setIndex}`">
                <SourceInfoCard 
                  :initialPosition="moduleSet.source.position"
                  :cardData="moduleSet.source.data"
                  :canDelete="canDeleteModule"
                  @update-data="(data) => updateCardData(setIndex, 'source', data)"
                  @add-module="handleAddModule"
                  @add-branch-source="handleAddBranchSource"
                  @delete-module="handleDeleteModule"
                />
                
                <!-- 動態添加的閥件資訊卡片 -->
                <template v-if="moduleSet.valveCards">
                  <template v-for="(valveCard, valveIndex) in moduleSet.valveCards" :key="`valve-card-${setIndex}-${valveIndex}`">
                    <ValveInfoCard 
                      v-if="valveCard.type !== 'branch-valve'"
                      :initialPosition="valveCard.position"
                      @delete-valve="handleDeleteValve"
                    />
                  </template>
                </template>
                
                <!-- 分支模組卡片 -->
                <template v-if="moduleSet.branchModuleCards">
                  <template v-for="(branchModule, branchModuleIndex) in moduleSet.branchModuleCards" :key="`branch-module-${setIndex}-${branchModuleIndex}`">
                    <ValveInfoCard 
                      :initialPosition="branchModule.valve.position"
                      :cardData="branchModule.valve.data"
                      :isBranchModule="true"
                      :module-set-index="setIndex"
                      :branch-module-index="branchModuleIndex"
                      @update-data="(data) => updateBranchValveData(setIndex, branchModuleIndex, data)"
                      @delete-valve="handleDeleteBranchValve"
                    />
                    <!-- 當 enableValve 為 true 時才顯示後方區塊 -->
                    <template v-if="branchModule.valve.data?.enableValve">
                      <PipelineInfoCard 
                        :initialPosition="branchModule.pipeline.position"
                        :cardData="branchModule.pipeline.data"
                        :isBranchModule="true"
                        @update-data="(data) => updateBranchPipelineData(setIndex, branchModuleIndex, data)"
                      />
                      <FloorInfoCard 
                        :initialPosition="branchModule.floor.position"
                        :cardData="branchModule.floor.data"
                        :isBranchModule="true"
                        @update-data="(data) => updateBranchFloorData(setIndex, branchModuleIndex, data)"
                      />
                      <!-- 分支 Panel+Equipment 群組 -->
                      <template v-for="(panelEquipmentGroup, groupIndex) in branchModule.panelEquipmentGroups" :key="panelEquipmentGroup.id">
                        <PanelInfoCard 
                          :initialPosition="panelEquipmentGroup.panel.position"
                          :cardData="panelEquipmentGroup.panel.data"
                          :isBranchModule="true"
                          :canDelete="groupIndex > 0"
                          @update-data="(data) => updateBranchPanelData(setIndex, branchModuleIndex, groupIndex, data)"
                          @delete-panel-group="(data) => handleDeleteBranchPanelGroup(setIndex, branchModuleIndex, groupIndex, data)"
                        />
                        <EquipmentInfoCard 
                          :initialPosition="panelEquipmentGroup.equipment.position"
                          :cardData="panelEquipmentGroup.equipment.data"
                          :isBranchModule="true"
                          @update-data="(data) => updateBranchEquipmentData(setIndex, branchModuleIndex, groupIndex, data)"
                        />
                        <!-- 額外的設備卡片 -->
                        <template v-if="panelEquipmentGroup.additionalEquipmentCards">
                          <template v-for="(additionalCard, cardIndex) in panelEquipmentGroup.additionalEquipmentCards" :key="additionalCard.id || `branch-additional-equipment-${setIndex}-${branchModuleIndex}-${groupIndex}-${cardIndex}`">
                            <!-- 分支額外設備卡片的閥件 -->
                            <ValveInfoCard 
                              v-if="additionalCard.valve"
                              :initialPosition="additionalCard.valve.position"
                              :cardData="additionalCard.valve.data"
                              :isPanelEquipmentValve="true"
                              @update-data="(data) => updateBranchAdditionalEquipmentValveData(setIndex, branchModuleIndex, groupIndex, cardIndex, data)"
                              @delete-valve="(data) => handleDeleteBranchAdditionalEquipmentValve(setIndex, branchModuleIndex, groupIndex, cardIndex, data)"
                            />
                            <EquipmentInfoCard 
                              :initialPosition="additionalCard.position"
                              :cardData="additionalCard.data"
                              :isBranchModule="true"
                              :canDelete="true"
                              @update-data="(data) => updateBranchAdditionalEquipmentData(setIndex, branchModuleIndex, groupIndex, cardIndex, data)"
                              @delete-equipment-card="(data) => handleDeleteBranchAdditionalEquipmentCard(setIndex, branchModuleIndex, groupIndex, cardIndex, data)"
                            />
                          </template>
                        </template>
                      </template>
                    </template>
                  </template>
                </template>
                
                <!-- 分支源頭資訊卡片 -->
                <template v-if="moduleSet.branchSourceCards">
                  <BranchSourceInfoCard 
                    v-for="(branchCard, branchIndex) in moduleSet.branchSourceCards" 
                    :key="`branch-source-card-${setIndex}-${branchIndex}`"
                    :initialPosition="branchCard.position"
                    :cardData="branchCard.data"
                    @update-data="(data) => updateBranchSourceData(setIndex, branchIndex, data)"
                    @delete-branch-source="handleDeleteBranchSource"
                  />
                </template>
                
                <PipelineInfoCard 
                  :initialPosition="moduleSet.pipeline.position" 
                  :cardData="moduleSet.pipeline.data"
                  @update-data="(data) => updateCardData(setIndex, 'pipeline', data)"
                />
                <FloorInfoCard 
                  :initialPosition="moduleSet.floor.position"
                  :cardData="moduleSet.floor.data"
                  @update-data="(data) => updateCardData(setIndex, 'floor', data)"
                />
                
                <!-- Panel+Equipment 群組使用 v-for 生成 -->
                <template v-for="(panelEquipmentGroup, groupIndex) in moduleSet.panelEquipmentGroups" :key="panelEquipmentGroup.id">
                  <PanelInfoCard 
                    :initialPosition="panelEquipmentGroup.panel.position"
                    :cardData="panelEquipmentGroup.panel.data"
                    :canDelete="groupIndex > 0"
                    @update-data="(data) => updatePanelData(setIndex, groupIndex, data)"
                    @delete-panel-group="(data) => handleDeletePanelGroup(setIndex, groupIndex, data)"
                  />
                  <!-- Panel 和 Equipment 之間的閥件 -->
                  <ValveInfoCard 
                    v-if="panelEquipmentGroup.valve"
                    :initialPosition="panelEquipmentGroup.valve.position"
                    :cardData="panelEquipmentGroup.valve.data"
                    :isPanelEquipmentValve="true"
                    @update-data="(data) => updatePanelEquipmentValveData(setIndex, groupIndex, data)"
                    @delete-valve="(data) => handleDeletePanelEquipmentValve(setIndex, groupIndex, data)"
                  />
                  <EquipmentInfoCard 
                    :initialPosition="panelEquipmentGroup.equipment.position"
                    :cardData="panelEquipmentGroup.equipment.data"
                    @update-data="(data) => updateEquipmentData(setIndex, groupIndex, data)"
                  />
                  <!-- 額外的設備卡片 -->
                  <template v-if="panelEquipmentGroup.additionalEquipmentCards">
                    <template v-for="(additionalCard, cardIndex) in panelEquipmentGroup.additionalEquipmentCards" :key="additionalCard.id || `additional-equipment-${setIndex}-${groupIndex}-${cardIndex}`">
                      <!-- 額外設備卡片的閥件 -->
                      <ValveInfoCard 
                        v-if="additionalCard.valve"
                        :initialPosition="additionalCard.valve.position"
                        :cardData="additionalCard.valve.data"
                        :isPanelEquipmentValve="true"
                        @update-data="(data) => updateAdditionalEquipmentValveData(setIndex, groupIndex, cardIndex, data)"
                        @delete-valve="(data) => handleDeleteAdditionalEquipmentValve(setIndex, groupIndex, cardIndex, data)"
                      />
                      <EquipmentInfoCard 
                        :initialPosition="additionalCard.position"
                        :cardData="additionalCard.data"
                        :canDelete="true"
                        @update-data="(data) => updateAdditionalEquipmentData(setIndex, groupIndex, cardIndex, data)"
                        @delete-equipment-card="(data) => handleDeleteAdditionalEquipmentCard(setIndex, groupIndex, cardIndex, data)"
                      />
                    </template>
                  </template>
                </template>
              </template>
            </div>
          </div>
        </VueZoomable>
      </div>
    </div>
  </div>
</template>

<script>

import Setting from './components/Setting.vue'
import FileManager from './components/FileManager.vue'
import ConnectionLine from './components/ConnectionLine.vue'
import SourceInfoCard from './components/FlowCards/SourceInfoCard.vue'
import BranchSourceInfoCard from './components/FlowCards/BranchSourceInfoCard.vue'
import PipelineInfoCard from './components/FlowCards/PipelineInfoCard.vue'
import FloorInfoCard from './components/FlowCards/FloorInfoCard.vue'
import PanelInfoCard from './components/FlowCards/PanelInfoCard.vue'
import EquipmentInfoCard from './components/FlowCards/EquipmentInfoCard.vue'
import ValveInfoCard from './components/FlowCards/ValveInfoCard.vue'
import Popup from './components/Popup.vue'
import { VueZoomable } from 'vue-zoomable'
import 'vue-zoomable/dist/style.css'
import ExcelJS from 'exceljs'

const CARD_WIDTH = 232
const CARD_HEIGHT_OFFSET = 150
const MODULE_SPACING = 150 // 模組之間的間距
const SOURCE_CARD_HEIGHT = 713 // 源頭資訊卡片高度
const BRANCH_SPACING = 48 // 分支卡片間距
const PANEL_EQUIPMENT_GROUP_SPACING = 150 // Panel+Equipment 群組之間的垂直間距
const FIRST_BRANCH_VALVE_SPACING = 45 // 第一個分支閥件與主位置之間的垂直間距
const BRANCH_VALVE_SPACING = 410 // 分支閥件之間的垂直間距（比 Panel+Equipment 群組間距大，避免重疊）

export default {
  name: 'App',
  components: {
    Setting,
    FileManager,
    ConnectionLine,
    SourceInfoCard,
    BranchSourceInfoCard,
    PipelineInfoCard,
    FloorInfoCard,
    PanelInfoCard,
    EquipmentInfoCard,
    ValveInfoCard,
    Popup,
    VueZoomable
  },
  data() {
    return {
      isSetting: false,
      isDefault: false,
      isFileManagerOpen: false,
      isSaveAsMode: false,
      // 當前檔案名稱
      currentFilename: '',
      currentFileId: null,
      // 最後儲存時間
      lastSavedAt: null,
      // 待讀取的檔案數據
      pendingLoadData: null,
      // Popup 相關狀態
      popupConfig: {
        visible: false,
        title: '',
        message: '',
        buttons: [],
        showIcon: true,
        closeOnOverlay: true
      },
      // 所有模組組（包括原始默認模組和動態添加的模組）
      // 初始化為空陣列，只有當用戶在設定中儲存時才會添加預設數據
      allModuleSets: [],
      // 設定資料
      settings: {
        customer: '',
        vendorInfo: '',
        surveySupervisor: '',
        surveyDate: '',
        machineName: '',
        locationId: '',
        code: '',
        engineerContact: '',
        constructionVendor: '',
        drawingDate: '',
        notes: '',
        hierarchyType: 'specialGas'
      }
    }
  },
  computed: {
    currentFlowchartData() {
      return {
        allModuleSets: this.allModuleSets,
        settings: this.settings
      };
    },

    displayTime() {
      if (!this.lastSavedAt) {
        return '';
      }
      const date = new Date(this.lastSavedAt);
      // 加上 7 小時
      date.setHours(date.getHours() + 8);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    },
    
    displayFilename() {
      if (!this.currentFilename && this.allModuleSets.length > 0) {
        return '新檔案';
      }
      return this.currentFilename;
    },

    
    lineConnections() {
      const connections = []
      
      // 所有模組組的連接線
      this.allModuleSets.forEach((moduleSet, setIndex) => {
        moduleSet.connections.forEach((conn, connIndex) => {
          // 檢查是否為分支閥件相關連接且 enableValve 為 false
          if (conn.branchModuleIndex !== undefined) {
            const branchModule = moduleSet.branchModuleCards[conn.branchModuleIndex];
            // 如果 enableValve 為 false，隱藏所有與分支後方區塊相關的連接線
            if (branchModule && branchModule.valve.data && !branchModule.valve.data.enableValve) {
              // 檢查連接線是否與分支後方區塊相關
              const isFromBranchCard = conn.from === 'branch-valve' || conn.from === 'branch-pipeline' || 
                                        conn.from === 'branch-floor' || conn.from === 'branch-panel' || 
                                        conn.from === 'branch-equipment';
              const isToBranchCard = conn.to === 'branch-valve' || conn.to === 'branch-pipeline' || 
                                      conn.to === 'branch-floor' || conn.to === 'branch-panel' || 
                                      conn.to === 'branch-equipment' || conn.to === 'branch-additional-equipment';
              
              // 如果是分支區域內的連接線（從分支卡片到分支卡片），則跳過
              if (isFromBranchCard && isToBranchCard) {
                return;
              }
            }
          }
          
          let fromCard, toCard
          
          // 處理不同的卡片類型
          if (conn.from === 'additional-icon') {
            // 使用自訂的起始位置
            fromCard = { position: conn.fromPosition }
          } else if (conn.from === 'panel-equipment-connection' || conn.from === 'branch-panel-equipment-connection' || conn.from === 'panel-equipment-valve') {
            // 額外設備卡片連接線的起始位置（包括從閥件出發的情況）
            fromCard = { position: conn.fromPosition }
          } else if (conn.from === 'additional-equipment-valve') {
            // 額外設備卡片的閥件（主分支）
            const groupIndex = conn.groupIndex !== undefined ? conn.groupIndex : 0
            const equipmentCardIndex = conn.equipmentCardIndex !== undefined ? conn.equipmentCardIndex : 0
            if (moduleSet.panelEquipmentGroups[groupIndex] && 
                moduleSet.panelEquipmentGroups[groupIndex].additionalEquipmentCards &&
                moduleSet.panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex] &&
                moduleSet.panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex].valve) {
              fromCard = { position: moduleSet.panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex].valve.position }
            } else {
              fromCard = { position: conn.fromPosition || { x: 0, y: 0 } }
            }
          } else if (conn.from === 'branch-additional-equipment-valve') {
            // 分支額外設備卡片的閥件
            const branchModuleIndex = conn.branchModuleIndex !== undefined ? conn.branchModuleIndex : 0
            const groupIndex = conn.panelEquipmentGroupIndex !== undefined ? conn.panelEquipmentGroupIndex : 0
            const equipmentCardIndex = conn.equipmentCardIndex !== undefined ? conn.equipmentCardIndex : 0
            if (moduleSet.branchModuleCards && 
                moduleSet.branchModuleCards[branchModuleIndex] &&
                moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups &&
                moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex] &&
                moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards &&
                moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex] &&
                moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex].valve) {
              fromCard = { position: moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex].valve.position }
            } else {
              fromCard = { position: conn.fromPosition || { x: 0, y: 0 } }
            }
          } else if (conn.from === 'branch-source-connection') {
            // 分支源頭資訊連接線的起始位置
            fromCard = { position: conn.fromPosition }
          } else if (conn.from === 'valve') {
            // 對於 valve，從 valveCards 陣列中獲取
            const valveIndex = conn.valveCardIndex !== undefined ? conn.valveCardIndex : 0
            fromCard = { position: moduleSet.valveCards[valveIndex].position }
          } else if (conn.from === 'branch-valve') {
            // 對於 branch-valve，從 valveCards 陣列中獲取
            const branchValveIndex = conn.branchValveCardIndex !== undefined ? conn.branchValveCardIndex : 0
            fromCard = { position: moduleSet.valveCards[branchValveIndex].position }
          } else if (conn.from === 'branch-pipeline' || conn.from === 'branch-floor') {
            // 對於分支模組的基本卡片，從 branchModuleCards 陣列中獲取
            const branchModuleIndex = conn.branchModuleIndex !== undefined ? conn.branchModuleIndex : 0
            fromCard = { position: moduleSet.branchModuleCards[branchModuleIndex][conn.from.replace('branch-', '')].position }
          } else if (conn.from === 'branch-panel' || conn.from === 'branch-equipment') {
            // 對於分支模組的 panel/equipment，從 panelEquipmentGroups 陣列中獲取
            const branchModuleIndex = conn.branchModuleIndex !== undefined ? conn.branchModuleIndex : 0
            const groupIndex = conn.panelEquipmentGroupIndex !== undefined ? conn.panelEquipmentGroupIndex : 0
            const cardType = conn.from.replace('branch-', '')
            fromCard = { position: moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex][cardType].position }
          } else if (conn.from === 'panel' || conn.from === 'equipment') {
            // 對於 panel 和 equipment，根據 groupIndex 獲取對應的群組
            const groupIndex = conn.groupIndex !== undefined ? conn.groupIndex : 0
            if (conn.fromGroupIndex !== undefined) {
              // 從上一個群組獲取 equipment
              fromCard = moduleSet.panelEquipmentGroups[conn.fromGroupIndex][conn.from]
            } else {
              // 從當前群組獲取
              fromCard = moduleSet.panelEquipmentGroups[groupIndex][conn.from]
            }
          } else {
            // 對於 source, pipeline, floor，直接從 moduleSet 獲取
            fromCard = moduleSet[conn.from]
          }
          
          if (conn.to === 'additional-equipment' || conn.to === 'branch-additional-equipment') {
            // 額外設備卡片
            if (conn.branchModuleIndex !== undefined) {
              // 分支額外設備卡片
              const branchModuleIndex = conn.branchModuleIndex
              const groupIndex = conn.panelEquipmentGroupIndex !== undefined ? conn.panelEquipmentGroupIndex : 0
              const equipmentCardIndex = conn.equipmentCardIndex !== undefined ? conn.equipmentCardIndex : 0
              toCard = { position: moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex].position }
            } else {
              // 主額外設備卡片
              const groupIndex = conn.groupIndex !== undefined ? conn.groupIndex : 0
              const equipmentCardIndex = conn.equipmentCardIndex !== undefined ? conn.equipmentCardIndex : 0
              toCard = { position: moduleSet.panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex].position }
            }
          } else if (conn.to === 'branch-source') {
            // 分支源頭資訊卡片
            const branchIndex = conn.branchCardIndex !== undefined ? conn.branchCardIndex : 0
            toCard = { position: moduleSet.branchSourceCards[branchIndex].position }
          } else if (conn.to === 'valve') {
            // 對於 valve，從 valveCards 陣列中獲取
            const valveIndex = conn.valveCardIndex !== undefined ? conn.valveCardIndex : 0
            toCard = { position: moduleSet.valveCards[valveIndex].position }
          } else if (conn.to === 'branch-valve') {
            // 對於 branch-valve，從 valveCards 陣列中獲取
            const branchValveIndex = conn.branchValveCardIndex !== undefined ? conn.branchValveCardIndex : 0
            toCard = { position: moduleSet.valveCards[branchValveIndex].position }
          } else if (conn.to === 'branch-pipeline' || conn.to === 'branch-floor') {
            // 對於分支模組的基本卡片，從 branchModuleCards 陣列中獲取
            const branchModuleIndex = conn.branchModuleIndex !== undefined ? conn.branchModuleIndex : 0
            toCard = { position: moduleSet.branchModuleCards[branchModuleIndex][conn.to.replace('branch-', '')].position }
          } else if (conn.to === 'branch-panel' || conn.to === 'branch-equipment') {
            // 對於分支模組的 panel/equipment，從 panelEquipmentGroups 陣列中獲取
            const branchModuleIndex = conn.branchModuleIndex !== undefined ? conn.branchModuleIndex : 0
            const groupIndex = conn.panelEquipmentGroupIndex !== undefined ? conn.panelEquipmentGroupIndex : 0
            const cardType = conn.to.replace('branch-', '')
            toCard = { position: moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex][cardType].position }
          } else if (conn.to === 'panel-equipment-valve') {
            // 對於 panel-equipment-valve，根據 groupIndex 獲取對應的群組中的 valve
            const groupIndex = conn.groupIndex !== undefined ? conn.groupIndex : 0
            if (moduleSet.panelEquipmentGroups[groupIndex] && moduleSet.panelEquipmentGroups[groupIndex].valve) {
              toCard = { position: moduleSet.panelEquipmentGroups[groupIndex].valve.position }
            } else {
              // 如果 valve 不存在，返回一個空對象作為占位符
              toCard = { position: { x: 0, y: 0 } }
            }
          } else if (conn.to === 'additional-equipment-valve') {
            // 對於 additional-equipment-valve，根據 groupIndex 和 equipmentCardIndex 獲取對應的閥件
            const groupIndex = conn.groupIndex !== undefined ? conn.groupIndex : 0
            const equipmentCardIndex = conn.equipmentCardIndex !== undefined ? conn.equipmentCardIndex : 0
            if (moduleSet.panelEquipmentGroups[groupIndex] && 
                moduleSet.panelEquipmentGroups[groupIndex].additionalEquipmentCards &&
                moduleSet.panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex] &&
                moduleSet.panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex].valve) {
              toCard = { position: moduleSet.panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex].valve.position }
            } else {
              // 如果 valve 不存在，返回一個空對象作為占位符
              toCard = { position: conn.toPosition || { x: 0, y: 0 } }
            }
          } else if (conn.to === 'branch-additional-equipment-valve') {
            // 對於 branch-additional-equipment-valve，根據 branchModuleIndex、groupIndex 和 equipmentCardIndex 獲取對應的閥件
            const branchModuleIndex = conn.branchModuleIndex !== undefined ? conn.branchModuleIndex : 0
            const groupIndex = conn.panelEquipmentGroupIndex !== undefined ? conn.panelEquipmentGroupIndex : 0
            const equipmentCardIndex = conn.equipmentCardIndex !== undefined ? conn.equipmentCardIndex : 0
            if (moduleSet.branchModuleCards && 
                moduleSet.branchModuleCards[branchModuleIndex] &&
                moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups &&
                moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex] &&
                moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards &&
                moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex] &&
                moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex].valve) {
              toCard = { position: moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex].valve.position }
            } else {
              // 如果 valve 不存在，返回一個空對象作為占位符
              toCard = { position: conn.toPosition || { x: 0, y: 0 } }
            }
          } else if (conn.to === 'panel' || conn.to === 'equipment') {
            // 對於 panel 和 equipment，根據 groupIndex 獲取對應的群組
            const groupIndex = conn.groupIndex !== undefined ? conn.groupIndex : 0
            toCard = moduleSet.panelEquipmentGroups[groupIndex][conn.to]
          } else {
            // 對於 source, pipeline, floor，直接從 moduleSet 獲取
            toCard = moduleSet[conn.to]
          }
          
          // 計算連接線的起始和結束位置
          let fromX, fromY, toX, toY
          
          if (conn.from === 'branch-source-connection') {
            // 分支源頭資訊連接線使用自定義起始位置
            if (conn.fromPosition) {
              fromX = conn.fromPosition.x
              fromY = conn.fromPosition.y
            } else {
              console.warn('Missing fromPosition for branch-source connection:', conn);
              return;
            }
          } else if (conn.from === 'panel-equipment-connection' || conn.from === 'branch-panel-equipment-connection' || conn.from === 'panel-equipment-valve') {
            // 額外設備卡片連接線使用自定義起始位置（包括從閥件出發的情況）
            if (conn.fromPosition) {
              fromX = conn.fromPosition.x
              fromY = conn.fromPosition.y
            } else {
              console.warn('Missing fromPosition for connection:', conn);
              return; // 跳過此連接線
            }
          } else if (conn.from === 'additional-equipment-valve' || conn.from === 'branch-additional-equipment-valve') {
            // 額外設備卡片閥件連接線使用自定義起始位置
            if (conn.fromPosition) {
              fromX = conn.fromPosition.x
              fromY = conn.fromPosition.y
            } else {
              // 如果沒有 fromPosition，嘗試從閥件位置計算
              if (conn.from === 'additional-equipment-valve') {
                const groupIndex = conn.groupIndex !== undefined ? conn.groupIndex : 0
                const equipmentCardIndex = conn.equipmentCardIndex !== undefined ? conn.equipmentCardIndex : 0
                if (moduleSet.panelEquipmentGroups[groupIndex] && 
                    moduleSet.panelEquipmentGroups[groupIndex].additionalEquipmentCards &&
                    moduleSet.panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex] &&
                    moduleSet.panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex].valve) {
                  const valve = moduleSet.panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex].valve
                  fromX = valve.position.x + CARD_WIDTH
                  fromY = valve.position.y + CARD_HEIGHT_OFFSET
                } else {
                  console.warn('Missing valve for additional-equipment-valve connection:', conn);
                  return
                }
              } else if (conn.from === 'branch-additional-equipment-valve') {
                const branchModuleIndex = conn.branchModuleIndex !== undefined ? conn.branchModuleIndex : 0
                const groupIndex = conn.panelEquipmentGroupIndex !== undefined ? conn.panelEquipmentGroupIndex : 0
                const equipmentCardIndex = conn.equipmentCardIndex !== undefined ? conn.equipmentCardIndex : 0
                if (moduleSet.branchModuleCards && 
                    moduleSet.branchModuleCards[branchModuleIndex] &&
                    moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups &&
                    moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex] &&
                    moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards &&
                    moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex] &&
                    moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex].valve) {
                  const valve = moduleSet.branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[equipmentCardIndex].valve
                  fromX = valve.position.x + CARD_WIDTH
                  fromY = valve.position.y + CARD_HEIGHT_OFFSET
                } else {
                  console.warn('Missing valve for branch-additional-equipment-valve connection:', conn);
                  return
                }
              } else {
                console.warn('Missing fromPosition for valve connection:', conn);
                return
              }
            }
          } else if (conn.from === 'source' && conn.fromPosition && conn.to === 'branch-valve') {
            // 分支閥件連接線使用自定義起始位置（源頭資訊到閥件資訊的連接線上）
            fromX = conn.fromPosition.x
            fromY = conn.fromPosition.y
          } else if (conn.from === 'valve' && conn.fromPosition) {
            // 其他閥件連接線使用自定義起始位置
            fromX = conn.fromPosition.x
            fromY = conn.fromPosition.y
          } else if (conn.from === 'branch-floor' && conn.fromPosition) {
            // 分支 floor 連接線使用自定義起始位置（add icon 右側）
            fromX = conn.fromPosition.x
            fromY = conn.fromPosition.y
          } else {
            // 其他連接線使用標準計算
            if (fromCard && fromCard.position) {
              fromX = fromCard.position.x + CARD_WIDTH
              fromY = fromCard.position.y + CARD_HEIGHT_OFFSET
            } else {
              console.warn('Invalid fromCard for connection:', conn);
              return; // 跳過此連接線
            }
          }
          
          if (conn.to === 'additional-equipment' || conn.to === 'branch-additional-equipment') {
            // 額外設備卡片連接線使用自定義結束位置
            if (conn.toPosition) {
              toX = conn.toPosition.x
              toY = conn.toPosition.y
            } else {
              console.warn('Missing toPosition for additional-equipment connection:', conn);
              return;
            }
          } else if (conn.to === 'branch-source') {
            // 分支源頭資訊連接線使用自定義結束位置
            if (conn.toPosition) {
              toX = conn.toPosition.x
              toY = conn.toPosition.y
            } else {
              console.warn('Missing toPosition for branch-source connection:', conn);
              return;
            }
          } else if (conn.to === 'branch-valve' && conn.toPosition) {
            // 分支閥件連接線使用自定義結束位置（分支閥件卡片左側）
            toX = conn.toPosition.x
            toY = conn.toPosition.y
          } else if (conn.to === 'branch-additional-equipment-valve' && conn.toPosition) {
            // 分支額外設備閥件連接線使用自定義結束位置
            toX = conn.toPosition.x
            toY = conn.toPosition.y
          } else {
            // 其他連接線使用標準計算
            if (toCard && toCard.position) {
              toX = toCard.position.x
              toY = toCard.position.y + CARD_HEIGHT_OFFSET
            } else {
              // 如果 toCard 無效，跳過此連接線
              console.warn('Invalid toCard for connection:', conn);
              return; // 在 forEach 中使用 return 跳過當前項
            }
          }
          
          connections.push({
            id: `line-${setIndex}-${connIndex}`,
            from: {
              x: fromX,
              y: fromY
            },
            to: {
              x: toX,
              y: toY
            },
            showAdditionalIcon: conn.showAdditionalIcon,
            showFaIcon: conn.showFaIcon,
            isBranchSource: conn.from === 'branch-source-connection', // 標識分支源頭資訊連接線
            isBranchValve: conn.from === 'source' && conn.to === 'branch-valve', // 標識分支閥件連接線
            isAdditionalEquipment: conn.from === 'panel-equipment-connection' || conn.from === 'branch-panel-equipment-connection' || conn.from === 'panel-equipment-valve' || conn.from === 'additional-equipment-valve' || conn.from === 'branch-additional-equipment-valve' // 標識額外設備卡片連接線
          })
        })
      })
      
      return connections
    },
    
    // 檢查是否可以刪除模組（至少需要保留一個模組組）
    canDeleteModule() {
      return this.allModuleSets.length > 1;
    }
  },
  methods: {
    // ==================== 設置相關方法 ====================
    openSetting() {
      if (this.allModuleSets.length > 0) {
        this.isSetting = !this.isSetting
      } 
    },
    
    closeSetting() {
      this.isSetting = false;
    },

    resetAll() {
      // 重置當前畫布
      this.allModuleSets = [];
      this.currentFileId = null;
      this.currentFilename = ''; // 重置為預設名稱
      this.lastSavedAt = null; // 清空儲存時間

      // 重置設定資料
      this.settings = {
        customer: '',
        vendorInfo: '',
        surveySupervisor: '',
        surveyDate: '',
        machineName: '',
        locationId: '',
        code: '',
        engineerContact: '',
        constructionVendor: '',
        drawingDate: '',
        notes: '',
        hierarchyType: 'specialGas'
      };
      this.isSetting = true
    },
    
    // ==================== 新建檔案方法 ====================
    handleNewFile() {
      // 判斷是否有單線圖
      const hasFlowchart = this.allModuleSets.length > 0;
      
      if (hasFlowchart) {
        // 判斷是否為未儲存的檔案
        const isUnsaved = this.currentFileId === null;
        const isExistingFile = this.currentFileId !== null && this.currentFilename !== '';
        
        let title, message;
        
        if (isUnsaved) {
          // 未儲存的新檔案
          title = '請先儲存當前畫布';
          message = '將開啟新畫布。<br>是否在關閉前儲存當前畫布?';
        } else if (isExistingFile) {
          // 已儲存的舊檔
          title = '請先儲存當前檔案';
          message = `將開啟新畫布。<br>是否在關閉前儲存變更至檔案「${this.currentFilename}」?`;
        } else {
          // 其他情況（不太可能發生）
          title = '請先儲存當前檔案';
          message = '將開啟新畫布。<br>是否在關閉前儲存當前畫布?';
        }
        
        this.showPopup({
          title,
          message,
          buttons: [
            {
              text: '否',
              class: 'default',
              action: () => {
                this.closePopup();
                this.resetAll();
              }
            },
            {
              text: '是',
              class: 'primary',
              action: () => {
                if (isUnsaved) {
                  // 未儲存的新檔案，打開檔案管理器
                  this.openFileManager();
                } else if (isExistingFile) {
                  // 已儲存的舊檔，直接更新
                  this.updateFile();
                  this.resetAll();
                }
                this.closePopup();
              }
            }
          ],
          showIcon: false,
          closeOnOverlay: true
        });
        return;
      } 



      this.resetAll();
    },
    
    handleSaveSetting(data) {
      console.log('保存數據:', data);
      // 更新設定資料
      this.settings = { ...data };
      // 如果 allModuleSets 為空，添加預設數據
      if (this.allModuleSets.length === 0) {
        this.isDefault = true;
        this.allModuleSets = this.createDefaultModuleSets();
      }
    },

    // ==================== 初始化和設定方法 ====================
    /**
     * 創建預設模組組
     * @returns {Array} 預設模組組陣列
     */
    createDefaultModuleSets() {
      return [
        {
          id: 'default-module-set',
          source: {
            position: { x: 100, y: 80 },
            data: {
              title: '',
              pipelineType: '單套管',
              gasType: '',
              valveNumber: '',
              sourceSize: '',
              doubleSleeveSize: '',
              connectorSpec: 'WELD',
              locationInfo: '',
              heatInsulation: false
            }
          },
          pipeline: {
            position: { x: 520, y: 80 },
            data: {
              length: '',
              material: 'NA'
            }
          },
          floor: {
            position: { x: 790, y: 80 },
            data: {
              sourceFloor: '',
              equipmentFloor: ''
            }
          },
          // 閥件卡片
          valveCards: [],
          // 分支源頭資訊卡片
          branchSourceCards: [],
          // Panel+Equipment 群組
          panelEquipmentGroups: [
            {
              id: 'panel-equipment-group-0',
              panel: {
                position: { x: 1120, y: 80 },
                data: {
                  enablePanel: true,
                  valve: '',
                  size: '',
                  valveConnector: '',
                  regulator: false,
                  pressureGauge: 'none',
                  backPipelineType: ''
                }
              },
              equipment: {
                position: { x: 1550, y: 80 },
                data: {
                  gasType: '',
                  size: '',
                  connector: '',
                  connectionName: '',
                  threeInOne: ''
                }
              },
              additionalEquipmentCards: []
            }
          ],
          // 連接線配置
          connections: [
            { 
              from: 'source', 
              to: 'pipeline',
              showAdditionalIcon: false,
              showFaIcon: true
            },
            { 
              from: 'pipeline', 
              to: 'floor',
              showAdditionalIcon: false,
              showFaIcon: false
            },
            { 
              from: 'floor', 
              to: 'panel',
              showAdditionalIcon: true,
              showFaIcon: false
            },
            { 
              from: 'panel', 
              to: 'equipment',
              showAdditionalIcon: true,
              showFaIcon: true
            }
          ]
        }
      ];
    },

    // ==================== 檔案管理方法 ====================
    /**
     * 處理儲存檔案事件
     */
    handleSaveFile() {
      // 1. 檢查是否有單線圖數據
      if (!this.allModuleSets || this.allModuleSets.length === 0) {
        
        this.showPopup({
          title: '',
          message: '請先建立或讀取單線圖',
          buttons: [
            {
              text: '確定',
              class: 'primary',
              action: () => {
                this.closePopup();
              }
            }
          ],
          showIcon: false,
          closeOnOverlay: true
        });
        return;
      }
      
      // 2. 判斷是否為新檔案
      if (!this.currentFileId) {
        // 如果是新檔案，直接打開另存的彈窗（檔案管理器）
        this.handleSaveAsFile();
      } else {
        // 如果是舊檔案，顯示確認儲存彈窗
        this.showSaveFilePopup();
      }
    },
    
    /**
     * 處理另存檔案事件
     */
    handleSaveAsFile() {
      // 1. 檢查是否有單線圖數據
      if (!this.allModuleSets || this.allModuleSets.length === 0) {
        this.showPopup({
          title: '',
          message: '請先建立或讀取單線圖',
          buttons: [
            {
              text: '確定',
              class: 'primary',
              action: () => {
                this.closePopup();
              }
            }
          ],
          showIcon: false,
          closeOnOverlay: true
        });
        return;
      }
      
      // 2. 如果有單線圖數據，直接打開檔案管理器
      this.isSaveAsMode = true;
      this.openFileManager();
    },
    
    /**
     * 處理讀取檔案事件
     */
    handleLoadFile() {
      this.isSaveAsMode = false;
      this.openFileManager();
    },
    
    /**
     * 開啟檔案管理器
     */
    openFileManager() {
      this.isFileManagerOpen = true;
    },
    
    /**
     * 關閉檔案管理器
     */
    closeFileManager() {
      this.isFileManagerOpen = false;
    },
    
    /**
     * 從檔案管理器儲存
     */
    async handleFileManagerSave({ project_name, data }) {
      try {
        const response = await fetch('http://localhost:3001/api/flowcharts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            project_name,
            data
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.currentFilename = project_name;
          this.currentFileId = result.data.id;
          // 獲取儲存後的時間
          await this.fetchFileUpdatedAt();

          console.log('File saved successfully:', result.data);
          this.closeFileManager();

          // 如果有待讀取的檔案，儲存完成後自動讀取
          if (this.pendingLoadData) {
            this.executeLoad(this.pendingLoadData);
            this.pendingLoadData = null;
            // 讀取完成後，FileManager已經在executeLoad中處理關閉
          } else {
            // 顯示儲存成功訊息
            this.showPopup({
              message: '已成功儲存檔案!',
              buttons: [
                {
                  text: '確定',
                  class: 'primary',
                  action: () => {
                    this.closePopup();
                  }
                }
              ],
              showIcon: false,
              closeOnOverlay: true
            });
          }

        } else {
          console.error('Error saving file:', result.error);
          // 檢查是否是重複檔案名稱的錯誤
          if (result.error === '系統存在同名檔案' || result.error.includes('already exists')) {
            this.showPopup({
              title: '系統存在同名檔案',
              message: `是否替換檔案「${project_name}」?`,
              buttons: [
                {
                  text: '取消',
                  class: 'default',
                  action: () => {
                    this.closePopup();
                  }
                },
                {
                  text: '替換檔案',
                  class: 'primary',
                  action: async () => {
                    await this.replaceExistingFile(project_name, data);
                    this.closePopup();
                  }
                }
              ],
              showIcon: false,
              closeOnOverlay: true
            });
          } else {
            this.showPopup({
              title: '',
              message: '儲存失敗：' + result.error,
              buttons: [
                {
                  text: '確定',
                  class: 'primary',
                  action: () => {
                    this.closePopup();
                  }
                }
              ],
              showIcon: false,
              closeOnOverlay: true
            });
          }
        }
      } catch (error) {
        console.error('Failed to save file:', error);
        this.showPopup({
          title: '',
          message: '儲存失敗：無法連接到伺服器',
          buttons: [
            {
              text: '確定',
              class: 'primary',
              action: () => {
                this.closePopup();
              }
            }
          ],
          showIcon: false,
          closeOnOverlay: true
        });
      }
    },
    
    /**
     * 從檔案管理器讀取
     */
    handleFileManagerLoad(loadData) {
      // 判斷是否有單線圖
      const hasFlowchart = this.allModuleSets.length > 0;

      // 如果沒有畫布，直接讀取並關閉FileManager
      if (!hasFlowchart) {
        this.executeLoad(loadData);
        // 只有在沒有pendingLoadData的情況下才關閉FileManager
        // （如果有pendingLoadData，說明可能是從popup來的，不要關閉）
        if (!this.pendingLoadData && loadData.shouldCloseFileManager) {
          this.closeFileManager();
        }
        return;
      }

      
      if (hasFlowchart) {
        // 判斷是否為未儲存的檔案
        const isUnsaved = this.currentFileId === null;
        const isExistingFile = this.currentFileId !== null && this.currentFilename !== '';
        
        let title, message;
        
        if (isUnsaved) {
          // 未儲存的新檔案
          title = '請先儲存當前畫布';
          message = '將讀取其他檔案。<br>是否在關閉前儲存當前畫布?';
        } else if (isExistingFile) {
          // 已儲存的舊檔
          title = '請先儲存當前檔案';
          message = `將讀取其他檔案。<br>是否在關閉前儲存變更至檔案「${this.currentFilename}」?`;
        } else {
          // 其他情況（不太可能發生）
          title = '請先儲存當前檔案';
          message = '將讀取其他檔案。<br>是否在關閉前儲存當前畫布?';
        }
        
        // 保存 loadData 以便在用户确认后使用

        this.pendingLoadData = loadData;
        // 根據檔案狀態決定按鈕文字
        const saveButtonText = isUnsaved ? '儲存檔案' : '儲存後讀取';
        

        this.showPopup({
          title,
          message,
          buttons: [
            {
              text: '不儲存，直接讀取',
              class: 'default',
              action: () => {
                this.executeLoad(this.pendingLoadData);
                this.pendingLoadData = null;
                this.closePopup();
                this.closeFileManager();

              }
            },
            {
              text: saveButtonText,
              class: 'primary',
              action: async () => {
                if (isUnsaved) {
                  // 未儲存的新畫布：關閉popup，讓用戶在FileManager中儲存
                  // FileManager已經開啟，不需要再次開啟
                  this.closePopup();
                  // pendingLoadData 會保留，待儲存完成後自動讀取

                } else if (isExistingFile) {
                  // 先更新，再讀取
                  await this.updateFileAndLoad(this.pendingLoadData);
                  this.pendingLoadData = null;
                  this.closePopup();
                  this.closeFileManager();
                }
              }
            }
          ],
          showIcon: false,
          closeOnOverlay: true
        });
      } else {
        // 沒有單線圖，直接讀取
        this.executeLoad(loadData);
      }
    },
    
    /**
     * 執行讀取檔案
     */
    executeLoad(loadData) {
      // 從讀取的資料重建模組
      if (loadData && loadData.data && loadData.data.allModuleSets) {
        this.allModuleSets = loadData.data.allModuleSets;
        
        // 從讀取的資料還原設定（如果有）
        if (loadData.data.settings) {
          this.settings = { ...loadData.data.settings };
        }
        
        // 設置當前文件信息
        if (loadData.file) {
          this.currentFileId = loadData.file.id;
          this.currentFilename = loadData.file.project_name;
          this.lastSavedAt = loadData.file.updated_at || null; // 設置儲存時間

        }
        
        console.log('File loaded successfully:', {
          id: this.currentFileId,
          filename: this.currentFilename
        });
      }
    },
    
    /**
     * 更新檔案並讀取新檔案
     */
    async updateFileAndLoad(loadData) {
      try {
        // 先更新當前檔案
        if (!this.currentFileId) {
          this.showWarningPopup('無法更新檔案');
          return;
        }
        
        const response = await fetch(`http://localhost:3001/api/flowcharts/${this.currentFileId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            project_name: this.currentFilename,
            data: this.getCurrentData()
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log('File updated successfully before loading new file');
          // 獲取更新後的時間
          await this.fetchFileUpdatedAt();

          // 顯示儲存成功訊息
          this.showPopup({
            message: '已成功儲存檔案!',
            buttons: [
              {
                text: '確定',
                class: 'primary',
                action: () => {
                  this.closePopup();
                  // 然後讀取新檔案
                  this.executeLoad(loadData);
                }
              }
            ],
            showIcon: false,
            closeOnOverlay: true
          });
        } else {
          console.error('Error updating file:', result.error);
          this.showWarningPopup('儲存失敗：' + result.error);
        }
      } catch (error) {
        console.error('Failed to update file:', error);
        this.showWarningPopup('儲存失敗：無法連接到伺服器');
      }
    },
    
    /**
     * 處理檔案管理器刪除檔案請求
     */
    handleFileManagerDelete(file) {
      // 檢查是否為當前開啟的檔案
      if (this.currentFileId && file.id === this.currentFileId) {
        this.showWarningPopup('無法刪除當前開啟的檔案');
        return;
      }
      

      this.showConfirmPopup(`確定要刪除檔案「${file.project_name}」嗎？`, async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/flowcharts/${file.id}`, {
            method: 'DELETE'
          });
          const result = await response.json();
          
          if (result.success) {
            // 重新載入檔案列表
            if (this.$refs.fileManagerRef) {
              await this.$refs.fileManagerRef.loadFiles();
            }
            this.closePopup();
          } else {
            console.error('Error deleting file:', result.error);
            this.showWarningPopup(`刪除失敗：${result.error}`);
          }
        } catch (error) {
          console.error('Failed to delete file:', error);
          this.showWarningPopup('刪除失敗：無法連接到伺服器');
        }
      }, () => {
        this.closePopup();
      });
    },
    
    /**
     * 更新現有檔案
     */
    async updateFile() {
      if (!this.currentFileId) return;
      
      try {
        const response = await fetch(`http://localhost:3001/api/flowcharts/${this.currentFileId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            project_name: this.currentFilename,
            data: this.getCurrentData()
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          console.log('File updated successfully');
          
          // 重新獲取檔案以取得更新後的 updated_at
          await this.fetchFileUpdatedAt();

          this.showPopup({
            message: '已成功儲存檔案!',
            buttons: [
              {
                text: '確定',
                class: 'primary',
                action: () => {
                  this.closePopup();
                }
              }
            ],
            showIcon: false,
            closeOnOverlay: true
          });
        } else {
          console.error('Error updating file:', result.error);
          this.showPopup({
            message: '更新失敗：' + result.error,
            buttons: [
              {
                text: '確定',
                class: 'primary',
                action: () => {
                  this.closePopup();
                }
              }
            ],
            showIcon: false,
            closeOnOverlay: true
          });
        }
      } catch (error) {
        console.error('Failed to update file:', error);
        alert('更新失敗：無法連接到伺服器');
      }
    },

    /**
     * 獲取檔案的更新時間
     */
    async fetchFileUpdatedAt() {
      if (!this.currentFileId) return;
      
      try {
        const response = await fetch(`http://localhost:3001/api/flowcharts/${this.currentFileId}`);
        const result = await response.json();
        
        if (result.success && result.data) {
          this.lastSavedAt = result.data.updated_at || null;
        }
      } catch (error) {
        console.error('Failed to fetch file updated_at:', error);
      }
    },
    

    
    /**
     * 替換已存在的檔案（根據檔案名稱）
     */
    async replaceExistingFile(project_name, data) {
      try {
        // 首先獲取所有檔案，找到同名檔案
        const response = await fetch('http://localhost:3001/api/flowcharts');
        const result = await response.json();
        
        if (!result.success) {
          throw new Error('無法獲取檔案列表');
        }
        
        // 找到同名檔案
        const existingFile = result.data.find(file => file.project_name === project_name);
        
        if (!existingFile) {
          this.showPopup({
            title: '',
            message: '找不到同名檔案',
            buttons: [
              {
                text: '確定',
                class: 'primary',
                action: () => {
                  this.closePopup();
                }
              }
            ],
            showIcon: false,
            closeOnOverlay: true
          });
          return;
        }
        
        // 更新該檔案
        const updateResponse = await fetch(`http://localhost:3001/api/flowcharts/${existingFile.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            project_name,
            data
          })
        });
        
        const updateResult = await updateResponse.json();
        
        if (updateResult.success) {
          this.currentFilename = project_name;
          this.currentFileId = existingFile.id;
          console.log('File replaced successfully');
          this.closeFileManager();
                    // 如果有待讀取的檔案，替換完成後自動讀取
                    if (this.pendingLoadData) {
            this.executeLoad(this.pendingLoadData);
            this.pendingLoadData = null;
            // 讀取完成後不需要顯示成功訊息，因為會直接讀取新檔案
          } else {
            this.showPopup({
              title: '',
              message: '已成功替換檔案!',
              buttons: [
                {
                  text: '確定',
                  class: 'primary',
                  action: () => {
                    this.closePopup();
                  }
                }
              ],
              showIcon: false,
              closeOnOverlay: true
            });
          }
        } else {
          console.error('Error replacing file:', updateResult.error);
          this.showPopup({
            title: '',
            message: '替換失敗：' + updateResult.error,
            buttons: [
              {
                text: '確定',
                class: 'primary',
                action: () => {
                  this.closePopup();
                }
              }
            ],
            showIcon: false,
            closeOnOverlay: true
          });
        }
      } catch (error) {
        console.error('Failed to replace file:', error);
        this.showPopup({
          title: '',
          message: '替換失敗：無法連接到伺服器',
          buttons: [
            {
              text: '確定',
              class: 'primary',
              action: () => {
                this.closePopup();
              }
            }
          ],
          showIcon: false,
          closeOnOverlay: true
        });
      }
    },
    
    /**
     * 取得當前資料
     */
    getCurrentData() {
      return {
        allModuleSets: this.allModuleSets,
        settings: this.settings
      };
    },

    // ==================== Excel 导出方法 ====================
    /**
     * 导出 Hierarchy Excel
     */
    async handleExportHierarchy() {
      // 检查是否有数据
      if (!this.allModuleSets || this.allModuleSets.length === 0) {
        this.showPopup({
          title: '',
          message: '請先建立或讀取單線圖',
          buttons: [
            {
              text: '確定',
              class: 'primary',
              action: () => {
                this.closePopup();
              }
            }
          ],
          showIcon: false,
          closeOnOverlay: true
        });
        return;
      }

      // 检查 hierarchyType
      const hierarchyType = this.settings.hierarchyType || 'specialGas';
      if (hierarchyType !== 'bulkGas' && hierarchyType !== 'specialGas') {
        this.showPopup({
          title: '',
          message: '請在設定中選擇 Bulk Gas 或 Special Gas 類型',
          buttons: [
            {
              text: '確定',
              class: 'primary',
              action: () => {
                this.closePopup();
              }
            }
          ],
          showIcon: false,
          closeOnOverlay: true
        });
        return;
      }

      try {
        // 根据类型选择模板文件
        const templateName = hierarchyType === 'bulkGas' 
          ? '範本表格Bulk Gas_空白.xlsx'
          : '範本表格Special Gas_空白.xlsx';
        const sheetName = hierarchyType === 'bulkGas' ? 'Bulk Gas' : 'Special Gas';
        const templatePath = `/assets/export/${templateName}`;
        
        const response = await fetch(templatePath);
        
        if (!response.ok) {
          throw new Error(`無法載入模板文件: ${templateName}`);
        }

        // 使用 ExcelJS 加载模板（保留格式）
        const arrayBuffer = await response.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);
        
        const worksheet = workbook.getWorksheet(sheetName);
        
        if (!worksheet) {
          throw new Error(`無法找到工作表: ${sheetName}`);
        }

        // 将流程图数据转换为 Excel 格式
        const excelData = this.convertToHierarchyExcel(this.allModuleSets);
        
        // 从第4行开始写入数据（前3行是标题）
        let rowIndex = 4;
        excelData.forEach((rowData) => {
          const row = worksheet.getRow(rowIndex);
          
          // 写入每一列的数据，保留原有单元格格式
          Object.keys(rowData).forEach((key) => {
            const colIndex = this.getColumnIndex(key);
            if (colIndex !== -1) {
              // colIndex 是 0-based，ExcelJS 的列是从 1 开始的
              const colNumber = colIndex + 1;
              const cell = row.getCell(colNumber);
              
              // 只更新值，保留原有格式
              cell.value = rowData[key] || '';
            }
          });
          
          rowIndex++;
        });

        // 生成文件名
        const filename = this.currentFilename || '新檔案';
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const typeName = hierarchyType === 'bulkGas' ? 'BulkGas' : 'SpecialGas';
        const exportFilename = `${filename}_Hierarchy_${typeName}_${timestamp}.xlsx`;

        // 导出文件（使用 ExcelJS 的 writeBuffer 方法）
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        
        // 创建下载链接
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = exportFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.showPopup({
          title: '',
          message: 'Hierarchy 导出成功！',
          buttons: [
            {
              text: '確定',
              class: 'primary',
              action: () => {
                this.closePopup();
              }
            }
          ],
          showIcon: false,
          closeOnOverlay: true
        });
      } catch (error) {
        console.error('导出失败:', error);
        this.showPopup({
          title: '',
          message: `导出失败: ${error.message}`,
          buttons: [
            {
              text: '確定',
              class: 'primary',
              action: () => {
                this.closePopup();
              }
            }
          ],
          showIcon: false,
          closeOnOverlay: true
        });
      }
    },

    /**
     * 将流程图数据转换为 Hierarchy Excel 格式
     * @param {Array} moduleSets - 所有模組組
     * @returns {Array} Excel 数据行数组
     */
    convertToHierarchyExcel(moduleSets) {
      const excelRows = [];

      moduleSets.forEach((moduleSet) => {
        const source = moduleSet.source?.data || {};
        const pipeline = moduleSet.pipeline?.data || {};
        const floor = moduleSet.floor?.data || {};
        
        // 获取分支数据
        const branches = this.getBranchData(moduleSet);
        
        // 获取 Panel 和 Equipment 数据
        const panelEquipmentGroups = moduleSet.panelEquipmentGroups || [];
        
        panelEquipmentGroups.forEach((group, groupIndex) => {
          const panel = group.panel?.data || {};
          const equipment = group.equipment?.data || {};
          
          // 创建 Excel 行数据
          const row = {
            'util-cat': source.gasType || '', // Utility Category
            'sm-no': source.valveNumber || '', // Sub main Take-off No.
            'sm-size': source.sourceSize || '', // Sub main Size
            'sm-floor': floor.sourceFloor || '', // Sub main 樓層
            'b1-size': branches[0]?.size || '', // Branch-1 Size
            'b1-floor': branches[0]?.floor || '', // Branch-1 樓層
            'b2-size': branches[1]?.size || '', // Branch-2 Size
            'b2-floor': branches[1]?.floor || '', // Branch-2 樓層
            'b3-size': branches[2]?.size || '', // Branch-3 Size
            'b3-floor': branches[2]?.floor || '', // Branch-3 樓層
            'dp-size': panel.size || '', // DP Panel Size
            'dp-type': this.getPanelType(panel), // DP Panel Type
            'dp-tag': panel.pressureGauge === 'eSensor' ? 'eSensor' : '', // E-Sensor (只显示 eSensor，其他为空)
            'pou-size': equipment.size || '', // POU Size
            'pou-ptype': this.getPOUType(equipment), // DP盤後軟/硬管
            'pou-comp': equipment.connectionName || '', // Component
          };
          
          excelRows.push(row);
          
          // 如果有额外的设备卡片，也为每个设备创建一行
          if (group.additionalEquipmentCards && group.additionalEquipmentCards.length > 0) {
            group.additionalEquipmentCards.forEach((additionalEquipment) => {
              const additionalRow = { ...row };
              const additionalData = additionalEquipment.data || {};
              additionalRow['pou-size'] = additionalData.size || '';
              additionalRow['pou-ptype'] = this.getPOUType(additionalData);
              additionalRow['pou-comp'] = additionalData.connectionName || '';
              excelRows.push(additionalRow);
            });
          }
        });
      });

      return excelRows;
    },

    /**
     * 获取分支数据
     * @param {Object} moduleSet - 模組組
     * @returns {Array} 分支数据数组
     */
    getBranchData(moduleSet) {
      const branches = [];
      
      // 获取分支源頭資訊卡片（branchSourceCards）
      if (moduleSet.branchSourceCards && moduleSet.branchSourceCards.length > 0) {
        moduleSet.branchSourceCards.forEach((branchSourceCard) => {
          const branchSource = branchSourceCard.data || {};
          branches.push({
            size: branchSource.sourceSize || '',
            floor: branchSource.locationInfo || '' // 使用 locationInfo 作为楼层信息
          });
        });
      }
      
      // 如果分支源頭資訊卡片不存在，尝试从分支模块卡片获取
      if (branches.length === 0 && moduleSet.branchModuleCards && moduleSet.branchModuleCards.length > 0) {
        moduleSet.branchModuleCards.forEach((branchModule) => {
          const branchSource = branchModule.source?.data || {};
          const branchFloor = branchModule.floor?.data || {};
          
          branches.push({
            size: branchSource.sourceSize || '',
            floor: branchFloor.equipmentFloor || branchFloor.sourceFloor || ''
          });
        });
      }
      
      return branches;
    },

    /**
     * 获取 Panel Type 字符串
     * @param {Object} panel - Panel 数据
     * @returns {String} Panel Type
     */
    getPanelType(panel) {
      if (!panel.enablePanel) return 'NA';
      
      const hasValve = panel.valve && panel.valve !== '';
      const hasRegulator = panel.regulator === true;
      const pressureGauge = panel.pressureGauge || 'none';
      
      // 根据组合返回类型
      // VRE: Valve + Regulator + eSensor
      // VRG: Valve + Regulator + Gauge
      // VG: Valve + Regulator
      // V: Valve only
      if (hasValve && hasRegulator && pressureGauge === 'eSensor') {
        return 'VRE';
      }
      if (hasValve && hasRegulator && pressureGauge === 'Gauge') {
        return 'VRG';
      }
      if (hasValve && hasRegulator) {
        return 'VG';
      }
      if (hasValve) {
        return 'V';
      }
      
      return '';
    },

    /**
     * 获取 POU Type (軟/硬管)
     * @param {Object} equipment - Equipment 数据
     * @returns {String} 軟管或硬管
     */
    getPOUType(equipment) {
      // 根据 connector 类型判断
      const connector = equipment.connector || '';
      if (connector.includes('軟') || connector.toLowerCase().includes('soft')) {
        return '軟管';
      }
      return '硬管';
    },

    /**
     * 获取列索引（根据模板的列名）
     * @param {String} columnKey - 列键名
     * @returns {Number} 列索引（0-based）
     */
    getColumnIndex(columnKey) {
      const columnMap = {
        'util-cat': 0,    // A
        'sm-no': 1,       // B
        'sm-size': 2,     // C
        'sm-floor': 3,    // D
        'b1-size': 4,     // E
        'b1-floor': 5,    // F
        'b2-size': 6,     // G
        'b2-floor': 7,    // H
        'b3-size': 8,     // I
        'b3-floor': 9,    // J
        'dp-size': 10,    // K
        'dp-type': 11,    // L
        'dp-tag': 12,     // M
        'pou-size': 13,   // N
        'pou-ptype': 14,  // O
        'pou-comp': 15,   // P
      };
      return columnMap[columnKey] !== undefined ? columnMap[columnKey] : -1;
    },

    // ==================== 檔案處理方法 (舊版) ====================
    /**
     * 處理儲存檔案事件 (舊版彈窗)
     */
    handleSaveFileOld() {
      this.showSaveFilePopup();
    },
    
    /**
     * 顯示儲存檔案確認彈窗
     */
    showSaveFilePopup() {
      this.showPopup({
        title: '確認儲存變更',
        message: `是否儲存變更至檔案「${this.currentFilename}」?`,
        buttons: [
          {
            text: '取消',
            class: 'default',
            action: () => {
              this.closePopup();
            }
          },
          {
            text: '另存新檔',
            class: 'default',
            action: () => {
              this.handleSaveAs();
              this.closePopup();
            }
          },
          {
            text: '儲存',
            class: 'primary',
            action: () => {
              this.updateFile();
              this.closePopup();
            }
          }
        ],
        showIcon: false,
        closeOnOverlay: true
      });
    },
    
    /**
     * 執行儲存
     */
    async executeSave() {
      console.log('儲存檔案:', this.currentFilename);
      
      try {
        const response = await fetch('http://localhost:3001/api/flowcharts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            project_name: this.currentFilename,
            data: this.getCurrentData()
          })
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.currentFileId = result.data.id;
          // 獲取儲存後的時間
          await this.fetchFileUpdatedAt();
          console.log('File saved successfully');
          
          // 顯示儲存成功訊息
          this.showPopup({
            message: '已成功儲存檔案!',
            buttons: [
              {
                text: '確定',
                class: 'primary',
                action: () => {
                  this.closePopup();
                }
              }
            ],
            showIcon: false,
            closeOnOverlay: true
          });
        } else {
          console.error('Error saving file:', result.error);
          alert('儲存失敗：' + result.error);
        }
      } catch (error) {
        console.error('Failed to save file:', error);
        alert('儲存失敗：無法連接到伺服器');
      }
    },
    
    /**
     * 執行另存新檔
     */
    handleSaveAs() {
      this.handleSaveAsFile();
    },

    // ==================== 卡片高度和位置計算 ====================
    /**
     * 獲取特定卡片類型的高度
     * @param {string} cardType - 卡片類型
     * @returns {number} 卡片高度
     */
    getCardHeight(cardType) {
      const cardHeights = {
        'source': 713,        // 源頭資訊卡片：包含多個輸入欄位和按鈕
        'branch-source': 713, // 分支源頭資訊卡片：與源頭資訊相同結構
        'pipeline': 177,      // 管線資訊卡片：2個輸入欄位
        'floor': 177,         // 樓層資訊卡片：2個輸入欄位
        'valve': 203,         // 閥件資訊卡片：多個輸入欄位
        'panel': 240,         // 盤面資訊卡片：多個選項
        'equipment': 430      // 設備資訊卡片：多個輸入欄位
      };
      
      return cardHeights[cardType] || 200; // 預設高度
    },
    
    /**
     * 計算模組組的總高度
     * @param {Object} moduleSet - 模組組對象
     * @returns {number} 模組組總高度
     */
    calculateModuleHeight(moduleSet) {
      let maxHeight = 0;
      
      // 計算基礎卡片高度
      const baseCards = ['source', 'pipeline', 'floor'];
      baseCards.forEach(cardType => {
        maxHeight = Math.max(maxHeight, this.getCardHeight(cardType));
      });
      
      // 計算閥件卡片高度（如果存在）
      if (moduleSet.valveCards?.length > 0) {
        maxHeight = Math.max(maxHeight, this.getCardHeight('valve'));
      }
      
      // 計算分支源頭資訊卡片高度（如果存在）
      if (moduleSet.branchSourceCards?.length > 0) {
        maxHeight = Math.max(maxHeight, this.getCardHeight('branch-source'));
      }
      
      // 計算 Panel+Equipment 群組高度
      if (moduleSet.panelEquipmentGroups?.length > 0) {
        moduleSet.panelEquipmentGroups.forEach(group => {
          const panelHeight = this.getCardHeight('panel');
          const equipmentHeight = this.getCardHeight('equipment');
          maxHeight = Math.max(maxHeight, Math.max(panelHeight, equipmentHeight));
        });
      }
      
      return maxHeight;
    },
    
    /**
     * 計算模組組的額外高度（分支和群組）
     * @param {Object} moduleSet - 模組組對象
     * @returns {number} 額外高度
     */
    calculateModuleExtraHeight(moduleSet) {
      let extraHeight = 0;
      
      // 計算分支源頭資訊卡片的額外高度
      if (moduleSet.branchSourceCards?.length > 0) {
        extraHeight += moduleSet.branchSourceCards.length * (this.getCardHeight('branch-source') + BRANCH_SPACING);
      }
      
      // 計算 Panel+Equipment 群組的額外高度
      if (moduleSet.panelEquipmentGroups?.length > 1) {
        const additionalGroups = moduleSet.panelEquipmentGroups.length - 1;
        extraHeight += additionalGroups * (this.getCardHeight('equipment') + PANEL_EQUIPMENT_GROUP_SPACING);
      }
      
      return extraHeight;
    },
    
    /**
     * 計算模組組的實際總高度（包括所有內容）
     * @param {Object} moduleSet - 模組組對象
     * @returns {number} 模組組的實際總高度
     */
    calculateModuleSetTotalHeight(moduleSet) {
      if (!moduleSet) return 0;
      
      // 獲取模組組的最頂部位置（從 source 卡片的 Y 位置開始）
      const topY = moduleSet.source.position.y;
      
      // 計算最底部的 Y 位置
      let maxBottomY = topY;
      
      // 基礎卡片的底部位置
      const sourceBottomY = moduleSet.source.position.y + this.getCardHeight('source');
      const pipelineBottomY = moduleSet.pipeline.position.y + this.getCardHeight('pipeline');
      const floorBottomY = moduleSet.floor.position.y + this.getCardHeight('floor');
      maxBottomY = Math.max(maxBottomY, sourceBottomY, pipelineBottomY, floorBottomY);
      
      // 閥件卡片的底部位置
      if (moduleSet.valveCards && moduleSet.valveCards.length > 0) {
        moduleSet.valveCards.forEach(valveCard => {
          const valveBottomY = valveCard.position.y + this.getCardHeight('valve');
          maxBottomY = Math.max(maxBottomY, valveBottomY);
        });
      }
      
      // 分支源頭資訊卡片的底部位置
      if (moduleSet.branchSourceCards && moduleSet.branchSourceCards.length > 0) {
        moduleSet.branchSourceCards.forEach(branchCard => {
          const branchBottomY = branchCard.position.y + this.getCardHeight('branch-source');
          maxBottomY = Math.max(maxBottomY, branchBottomY);
        });
      }
      
      // Panel+Equipment 群組的底部位置（包括額外的設備卡片）
      if (moduleSet.panelEquipmentGroups && moduleSet.panelEquipmentGroups.length > 0) {
        moduleSet.panelEquipmentGroups.forEach(group => {
          const panelBottomY = group.panel.position.y + this.getCardHeight('panel');
          const equipmentBottomY = group.equipment.position.y + this.getCardHeight('equipment');
          let groupMaxBottomY = Math.max(panelBottomY, equipmentBottomY);
          
          // 如果有額外的設備卡片，檢查它們的最底部位置
          if (group.additionalEquipmentCards && group.additionalEquipmentCards.length > 0) {
            group.additionalEquipmentCards.forEach(card => {
              const cardBottomY = card.position.y + this.getCardHeight('equipment');
              groupMaxBottomY = Math.max(groupMaxBottomY, cardBottomY);
            });
          }
          
          maxBottomY = Math.max(maxBottomY, groupMaxBottomY);
        });
      }
      
      // 分支模組的底部位置
      if (moduleSet.branchModuleCards && moduleSet.branchModuleCards.length > 0) {
        moduleSet.branchModuleCards.forEach(branchModule => {
          // 分支閥件底部
          const branchValveBottomY = branchModule.valve.position.y + this.getCardHeight('valve');
          maxBottomY = Math.max(maxBottomY, branchValveBottomY);
          
          // 分支 Panel+Equipment 群組的底部位置
          if (branchModule.panelEquipmentGroups && branchModule.panelEquipmentGroups.length > 0) {
            branchModule.panelEquipmentGroups.forEach(group => {
              const panelBottomY = group.panel.position.y + this.getCardHeight('panel');
              const equipmentBottomY = group.equipment.position.y + this.getCardHeight('equipment');
              let groupMaxBottomY = Math.max(panelBottomY, equipmentBottomY);
              
              // 如果有額外的設備卡片，檢查它們的最底部位置
              if (group.additionalEquipmentCards && group.additionalEquipmentCards.length > 0) {
                group.additionalEquipmentCards.forEach(card => {
                  const cardBottomY = card.position.y + this.getCardHeight('equipment');
                  groupMaxBottomY = Math.max(groupMaxBottomY, cardBottomY);
                });
              }
              
              maxBottomY = Math.max(maxBottomY, groupMaxBottomY);
            });
          }
        });
      }
      
      // 返回從頂部到底部的總高度
      return maxBottomY - topY;
    },
    
    /**
     * 更新所有模組組的位置（當任一模組組的高度變化時調用）
     */
    updateAllModuleSetPositions() {
      console.log('更新所有模組組的位置');
      
      if (this.allModuleSets.length === 0) {
        return;
      }
      
      // 第一個模組組保持原位
      let currentBottomY = this.allModuleSets[0].source.position.y + this.calculateModuleSetTotalHeight(this.allModuleSets[0]);
      
      // 從第二個模組組開始，依次更新位置
      for (let i = 1; i < this.allModuleSets.length; i++) {
        const moduleSet = this.allModuleSets[i];
        const currentTopY = moduleSet.source.position.y;
        const currentX = moduleSet.source.position.x;
        
        // 計算新位置（前一個模組組的底部 + 間距）
        const newY = currentBottomY + MODULE_SPACING;
        const offsetY = newY - currentTopY;
        
        if (Math.abs(offsetY) > 0.01) {
          console.log(`模組組 ${i} 位置更新: Y=${currentTopY} -> ${newY}, 偏移=${offsetY}`);
          
          // 更新源頭資訊卡片位置
          moduleSet.source.position.y = newY;
          
          // 更新管線資訊卡片位置
          moduleSet.pipeline.position.y = newY;
          
          // 更新樓層資訊卡片位置
          moduleSet.floor.position.y = newY;
          
          // 更新閥件卡片位置
          if (moduleSet.valveCards && moduleSet.valveCards.length > 0) {
            moduleSet.valveCards.forEach(valveCard => {
              valveCard.position.y += offsetY;
            });
          }
          
          // 更新分支源頭資訊卡片位置
          if (moduleSet.branchSourceCards && moduleSet.branchSourceCards.length > 0) {
            moduleSet.branchSourceCards.forEach(branchCard => {
              branchCard.position.y += offsetY;
            });
          }
          
          // 更新 Panel+Equipment 群組位置
          if (moduleSet.panelEquipmentGroups && moduleSet.panelEquipmentGroups.length > 0) {
            moduleSet.panelEquipmentGroups.forEach(group => {
              group.panel.position.y += offsetY;
              group.equipment.position.y += offsetY;
              
              // 更新閥件位置
              if (group.valve) {
                group.valve.position.y += offsetY;
              }
              
              // 更新額外設備卡片位置
              if (group.additionalEquipmentCards && group.additionalEquipmentCards.length > 0) {
                group.additionalEquipmentCards.forEach(card => {
                  card.position.y += offsetY;
                });
              }
            });
          }
          
          // 更新分支模組位置
          if (moduleSet.branchModuleCards && moduleSet.branchModuleCards.length > 0) {
            moduleSet.branchModuleCards.forEach(branchModule => {
              branchModule.valve.position.y += offsetY;
              branchModule.pipeline.position.y += offsetY;
              branchModule.floor.position.y += offsetY;
              
              // 更新分支 Panel+Equipment 群組位置
              if (branchModule.panelEquipmentGroups && branchModule.panelEquipmentGroups.length > 0) {
                branchModule.panelEquipmentGroups.forEach(group => {
                  group.panel.position.y += offsetY;
                  group.equipment.position.y += offsetY;
                  
                  // 更新額外設備卡片位置
                  if (group.additionalEquipmentCards && group.additionalEquipmentCards.length > 0) {
                    group.additionalEquipmentCards.forEach(card => {
                      card.position.y += offsetY;
                    });
                  }
                });
              }
            });
          }
          
          // 更新該模組組的連接線位置
          this.updateModuleSetConnections(moduleSet, offsetY);
        }
        
        // 計算當前模組組的新底部位置
        currentBottomY = newY + this.calculateModuleSetTotalHeight(moduleSet);
        
        // 更新該模組組的所有設備卡片連接線位置（重新計算起點）
        // 這很重要，因為設備卡片的連接線起點是基於 panel 位置計算的
        if (moduleSet.branchModuleCards && moduleSet.branchModuleCards.length > 0) {
          moduleSet.branchModuleCards.forEach((_, branchIndex) => {
            this.updateAdditionalEquipmentConnectionLines(moduleSet, branchIndex);
          });
        }
        // 也更新主分支的設備卡片連接線
        this.updateAdditionalEquipmentConnectionLines(moduleSet, -1);
      }
      
      // 在所有模組組位置更新完成後，統一重新計算所有設備卡片連接線
      // 這確保所有連接線都基於最新的位置
      console.log('統一更新所有模組組的設備卡片連接線');
      this.allModuleSets.forEach((moduleSet, idx) => {
        if (moduleSet.branchModuleCards && moduleSet.branchModuleCards.length > 0) {
          moduleSet.branchModuleCards.forEach((_, branchIndex) => {
            console.log(`模組組 ${idx} 分支 ${branchIndex}: 更新設備卡片連接線`);
            this.updateAdditionalEquipmentConnectionLines(moduleSet, branchIndex);
          });
        }
        // 也更新主分支
        this.updateAdditionalEquipmentConnectionLines(moduleSet, -1);
      });
      
      console.log('已更新所有模組組的位置');
    },
    
    /**
     * 更新模組組內所有連接線的位置
     * @param {Object} moduleSet - 模組組對象
     * @param {number} offsetY - Y 軸偏移量
     */
    updateModuleSetConnections(moduleSet, offsetY) {
      if (!moduleSet.connections) return;
      
      moduleSet.connections.forEach(conn => {
        // 更新連接線的起始位置
        if (conn.fromPosition) {
          conn.fromPosition.y += offsetY;
        }
        
        // 更新連接線的終點位置
        if (conn.toPosition) {
          conn.toPosition.y += offsetY;
        }
      });
    },
    
    /**
     * 計算下一個模組組的位置
     * @param {Object} clickedPosition - 點擊位置
     * @returns {Object} 新位置坐標
     */
    calculateNextModulePosition(clickedPosition) {
      let totalHeight = 0;
      
      // 遍歷所有模組組，計算每個模組組的實際高度
      this.allModuleSets.forEach(moduleSet => {
        const totalModuleHeight = this.calculateModuleSetTotalHeight(moduleSet);
        
        // 計算該模組組的底部位置
        const moduleBottomY = moduleSet.source.position.y + totalModuleHeight;
        totalHeight = Math.max(totalHeight, moduleBottomY);
      });
      
      // 如果沒有現有模組，使用點擊位置作為起始點
      if (totalHeight === 0) {
        totalHeight = clickedPosition.y;
      }
      
      // 返回新位置：最下方模組的底部 + 模組間距
      return {
        x: clickedPosition.x,
        y: totalHeight + MODULE_SPACING
      };
    },

    // ==================== 連接線事件處理 ====================
    /**
     * 處理加號圖標點擊事件
     * @param {Object} connection - 連接對象
     */
    handleAdditionalIconClick(connection) {
      console.log('加號圖標被點擊，連接:', connection);
      
      const { moduleSetIndex, connIndex } = this.parseConnectionId(connection.id);
      const moduleSet = this.allModuleSets[moduleSetIndex];
      const connConfig = moduleSet.connections[connIndex];
      
      // 檢查是否是樓層到盤面的連接線（主分支支援）
      if (connConfig.from === 'floor' && connConfig.to === 'panel') {
        this.addPanelEquipmentModule(connConfig, moduleSetIndex);
      } 
      // 檢查是否是分支的 floor → panel 連接線（分支模組支援 - 新增盤面）
      else if (connConfig.from === 'branch-floor' && connConfig.to === 'branch-panel') {
        this.addBranchPanelEquipmentModule(connConfig, moduleSetIndex);
      }
      // 檢查是否是 panel → equipment 連接線（新增設備卡片）
      else if (connConfig.from === 'panel' && connConfig.to === 'equipment') {
        this.addEquipmentCard(connConfig, moduleSetIndex);
      }
      // 檢查是否是 panel → panel-equipment-valve 連接線（新增設備卡片）
      else if (connConfig.from === 'panel' && connConfig.to === 'panel-equipment-valve') {
        // 對於有閥件的情況，從閥件連接到新的設備
        this.addEquipmentCardWithValve(connConfig, moduleSetIndex);
      }
      // 檢查是否是分支的 panel → equipment 連接線（新增設備卡片）
      else if (connConfig.from === 'branch-panel' && connConfig.to === 'branch-equipment') {
        this.addBranchEquipmentCard(connConfig, moduleSetIndex);
      } 
      else {
        this.showWarningPopup(`加號圖標被點擊！連接 ID: ${connection.id}`);
      }
    },
    
    /**
     * 處理紫色圖標點擊事件
     * @param {Object} connection - 連接對象
     */
    handleFaIconClick(connection) {
      console.log('紫色圖標被點擊，連接:', connection);
      
      const { moduleSetIndex, connIndex } = this.parseConnectionId(connection.id);
      const moduleSet = this.allModuleSets[moduleSetIndex];
      const connConfig = moduleSet.connections[connIndex];
      
      // 檢查是否是閥件相關的連接線
      const isValveRelatedConnection = 
        (connConfig.from === 'source' && connConfig.to === 'pipeline') || // 初始狀態：source → pipeline
        (connConfig.from === 'source' && connConfig.to === 'valve') ||    // 有閥件後：source → valve
        (connConfig.from === 'valve' && connConfig.to === 'pipeline');  // 有閥件後：valve → pipeline
      
      // 檢查是否是 panel → equipment 連接線（在盤面和設備之間添加閥件）
      const isPanelEquipmentConnection = 
        (connConfig.from === 'panel' && connConfig.to === 'equipment');
      
      // 檢查是否是額外設備卡片連接線（在盤面和額外設備卡片之間添加閥件）
      const isAdditionalEquipmentConnection = 
        (connConfig.from === 'panel-equipment-connection' || connConfig.from === 'panel-equipment-valve') &&
        connConfig.to === 'additional-equipment';
      
      // 檢查是否是分支額外設備卡片連接線（在分支盤面和分支額外設備卡片之間添加閥件）
      const isBranchAdditionalEquipmentConnection = 
        connConfig.from === 'branch-panel-equipment-connection' &&
        connConfig.to === 'branch-additional-equipment';
      
      if (isValveRelatedConnection) {
        // 檢查是否已經有閥件
        if (moduleSet.valveCards && moduleSet.valveCards.length > 0) {
          // 如果已經有閥件，添加分支閥件
          this.addBranchValveCard(connection, moduleSetIndex);
      } else {
          // 如果沒有閥件，添加普通閥件
          this.addValveInfoCard(connection, moduleSetIndex);
        }
      } else if (isPanelEquipmentConnection) {
        // 在 panel 和 equipment 之間添加閥件
        this.addValveBetweenPanelAndEquipment(connection, moduleSetIndex);
      } else if (isAdditionalEquipmentConnection) {
        // 在 panel 和額外設備卡片之間添加閥件（主分支）
        this.addValveBetweenPanelAndAdditionalEquipment(connection, moduleSetIndex);
      } else if (isBranchAdditionalEquipmentConnection) {
        // 在分支 panel 和分支額外設備卡片之間添加閥件
        this.addValveBetweenBranchPanelAndAdditionalEquipment(connection, moduleSetIndex);
      } else {
        this.showWarningPopup(`紫色圖標被點擊！連接 ID: ${connection.id}`);
      }
    },
    
    /**
     * 解析連接線 ID 獲取模組組索引和連接索引
     * @param {string} connectionId - 連接線 ID
     * @returns {Object} 包含 moduleSetIndex 和 connIndex 的對象
     */
    parseConnectionId(connectionId) {
      const idParts = connectionId.split('-');
      return {
        moduleSetIndex: parseInt(idParts[1]),
        connIndex: parseInt(idParts[2])
      };
    },
    // ==================== 模組管理 ====================
    /**
     * 處理添加模組事件
     * @param {Object} moduleData - 模組數據
     */
    handleAddModule(moduleData) {
      console.log('添加完整模組組:', moduleData);
      
      const newPosition = this.calculateNextModulePosition(moduleData.position);
      const newModuleSet = this.createNewModuleSet(newPosition);
      
      this.allModuleSets.push(newModuleSet);
      console.log(`已添加新模組組，總模組數量: ${this.allModuleSets.length}`);
    },
    
    /**
     * 創建新的模組組
     * @param {Object} position - 位置坐標
     * @returns {Object} 新的模組組對象
     */
    createNewModuleSet(position) {
      const baseX = position.x;
      const baseY = position.y;
      
      return {
        id: `module-set-${Date.now()}`,
        source: { 
          position: { x: baseX, y: baseY },
          data: {
            title: '',
            pipelineType: '單套管',
            gasType: '',
            valveNumber: '',
            sourceSize: '',
            doubleSleeveSize: '',
            connectorSpec: 'WELD',
            locationInfo: '',
            heatInsulation: false
          }
        },
        pipeline: { 
          position: { x: baseX + 420, y: baseY },
          data: {
            length: '',
            material: 'NA'
          }
        },
        floor: { 
          position: { x: baseX + 690, y: baseY },
          data: {
            sourceFloor: '',
            equipmentFloor: ''
          }
        },
        valveCards: [],
        branchSourceCards: [],
        panelEquipmentGroups: [
          {
            id: `panel-equipment-group-${Date.now()}`,
            panel: { 
              position: { x: baseX + 1020, y: baseY },
              data: {
                enablePanel: true,
                valve: '',
                size: '',
                valveConnector: '',
                regulator: false,
                pressureGauge: 'none',
                backPipelineType: ''
              }
            },
            equipment: { 
              position: { x: baseX + 1450, y: baseY },
              data: {
                gasType: '',
                size: '',
                connector: '',
                connectionName: '',
                threeInOne: ''
              }
            },
            additionalEquipmentCards: []
          }
        ],
        connections: this.createDefaultConnections()
      };
    },
    
    /**
     * 創建預設連接線配置
     * @returns {Array} 連接線配置數組
     */
    createDefaultConnections() {
      return [
        { from: 'source', to: 'pipeline', showAdditionalIcon: false, showFaIcon: true },
        { from: 'pipeline', to: 'floor', showAdditionalIcon: false, showFaIcon: false },
        { from: 'floor', to: 'panel', groupIndex: 0, showAdditionalIcon: true, showFaIcon: false },
        { from: 'panel', to: 'equipment', groupIndex: 0, showAdditionalIcon: true, showFaIcon: true }
      ];
    },
    
    /**
     * 更新卡片數據
     * @param {number} setIndex - 模組組索引
     * @param {string} cardType - 卡片類型 ('source', 'pipeline', 'floor')
     * @param {Object} data - 新的數據
     */
    updateCardData(setIndex, cardType, data) {
      if (this.allModuleSets[setIndex] && this.allModuleSets[setIndex][cardType]) {
        this.allModuleSets[setIndex][cardType].data = data;
      }
    },

    /**
     * 更新Panel卡片數據
     * @param {number} setIndex - 模組組索引
     * @param {number} groupIndex - Panel+Equipment群組索引
     * @param {Object} data - 新的數據
     */
    updatePanelData(setIndex, groupIndex, data) {
      if (this.allModuleSets[setIndex] && 
          this.allModuleSets[setIndex].panelEquipmentGroups && 
          this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex]) {
        this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex].panel.data = data;
      }
    },

    /**
     * 更新Equipment卡片數據
     * @param {number} setIndex - 模組組索引
     * @param {number} groupIndex - Panel+Equipment群組索引
     * @param {Object} data - 新的數據
     */
    updateEquipmentData(setIndex, groupIndex, data) {
      if (this.allModuleSets[setIndex] && 
          this.allModuleSets[setIndex].panelEquipmentGroups && 
          this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex]) {
        this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex].equipment.data = data;
      }
    },

    /**
     * 更新BranchSource卡片數據
     * @param {number} setIndex - 模組組索引
     * @param {number} branchIndex - 分支卡片索引
     * @param {Object} data - 新的數據
     */
    updateBranchSourceData(setIndex, branchIndex, data) {
      if (this.allModuleSets[setIndex] && 
          this.allModuleSets[setIndex].branchSourceCards && 
          this.allModuleSets[setIndex].branchSourceCards[branchIndex]) {
        this.allModuleSets[setIndex].branchSourceCards[branchIndex].data = data;
      }
    },

    /**
     * 更新分支閥件數據
     */
    updateBranchValveData(setIndex, branchModuleIndex, data) {
      if (this.allModuleSets[setIndex] && 
          this.allModuleSets[setIndex].branchModuleCards && 
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex]) {
        this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].valve.data = data;
      }
    },

    /**
     * 更新分支Pipeline數據
     */
    updateBranchPipelineData(setIndex, branchModuleIndex, data) {
      if (this.allModuleSets[setIndex] && 
          this.allModuleSets[setIndex].branchModuleCards && 
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex]) {
        this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].pipeline.data = data;
      }
    },

    /**
     * 更新分支Floor數據
     */
    updateBranchFloorData(setIndex, branchModuleIndex, data) {
      if (this.allModuleSets[setIndex] && 
          this.allModuleSets[setIndex].branchModuleCards && 
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex]) {
        this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].floor.data = data;
      }
    },

    /**
     * 更新分支Panel數據
     */
    updateBranchPanelData(setIndex, branchModuleIndex, groupIndex, data) {
      if (this.allModuleSets[setIndex] && 
          this.allModuleSets[setIndex].branchModuleCards && 
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex] &&
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups &&
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex]) {
        this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].panel.data = data;
      }
    },

    /**
     * 更新分支Equipment數據
     */
    updateBranchEquipmentData(setIndex, branchModuleIndex, groupIndex, data) {
      if (this.allModuleSets[setIndex] && 
          this.allModuleSets[setIndex].branchModuleCards && 
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex] &&
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups &&
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex]) {
        this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].equipment.data = data;
      }
    },

    /**
     * 更新Panel-Equipment之間閥件數據
     */
    updatePanelEquipmentValveData(setIndex, groupIndex, data) {
      if (this.allModuleSets[setIndex] && 
          this.allModuleSets[setIndex].panelEquipmentGroups && 
          this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex] &&
          this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex].valve) {
        this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex].valve.data = data;
      }
    },
    
    /**
     * 更新額外設備卡片閥件數據
     */
    updateAdditionalEquipmentValveData(setIndex, groupIndex, cardIndex, data) {
      if (this.allModuleSets[setIndex] && 
          this.allModuleSets[setIndex].panelEquipmentGroups && 
          this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex] &&
          this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards &&
          this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[cardIndex] &&
          this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[cardIndex].valve) {
        this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[cardIndex].valve.data = data;
      }
    },
    
    /**
     * 更新分支額外設備卡片閥件數據
     */
    updateBranchAdditionalEquipmentValveData(setIndex, branchModuleIndex, groupIndex, cardIndex, data) {
      if (this.allModuleSets[setIndex] && 
          this.allModuleSets[setIndex].branchModuleCards &&
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex] &&
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups && 
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex] &&
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards &&
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[cardIndex] &&
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[cardIndex].valve) {
        this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[cardIndex].valve.data = data;
      }
    },

    /**
     * 更新額外設備卡片數據
     */
    updateAdditionalEquipmentData(setIndex, groupIndex, cardIndex, data) {
      if (this.allModuleSets[setIndex] && 
          this.allModuleSets[setIndex].panelEquipmentGroups && 
          this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex] &&
          this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards &&
          this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[cardIndex]) {
        this.allModuleSets[setIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[cardIndex].data = data;
      }
    },

    /**
     * 更新分支額外設備卡片數據
     */
    updateBranchAdditionalEquipmentData(setIndex, branchModuleIndex, groupIndex, cardIndex, data) {
      if (this.allModuleSets[setIndex] && 
          this.allModuleSets[setIndex].branchModuleCards &&
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex] &&
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups && 
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex] &&
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards &&
          this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[cardIndex]) {
        this.allModuleSets[setIndex].branchModuleCards[branchModuleIndex].panelEquipmentGroups[groupIndex].additionalEquipmentCards[cardIndex].data = data;
      }
    },

    /**
     * 處理刪除模組事件
     * @param {Object} moduleData - 模組數據
     */
    handleDeleteModule(moduleData) {
      console.log('刪除模組:', moduleData);

      this.showConfirmPopup('是否確定刪除此源頭?', () => {
        this.closePopup();
          
        const moduleIndex = this.findModuleSetByPosition(moduleData.position);
        if (moduleIndex !== -1) {
          this.allModuleSets.splice(moduleIndex, 1);
          console.log(`已刪除模組組，剩餘模組數量: ${this.allModuleSets.length}`);
        }
        
      }, () => {
        this.closePopup();
      }); 
    
    
    },
    
    /**
     * 根據位置查找模組組索引
     * @param {Object} position - 位置坐標
     * @returns {number} 模組組索引，找不到返回 -1
     */
    findModuleSetByPosition(position) {
      return this.allModuleSets.findIndex(moduleSet => 
        moduleSet.source.position.x === position.x && 
        moduleSet.source.position.y === position.y
      );
    },
    // ==================== 分支源頭資訊管理 ====================
    /**
     * 處理添加分支源頭資訊事件
     * @param {Object} branchData - 分支數據
     */
    handleAddBranchSource(branchData) {
      console.log('添加分支源頭資訊卡片:', branchData);
      
      const moduleSetIndex = this.findModuleSetByPosition(branchData.sourcePosition);
      if (moduleSetIndex === -1) {
        console.error('找不到對應的模組');
        return;
      }
      
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      const newBranchCard = this.createBranchSourceCard(branchData, currentModuleSet);
      
      currentModuleSet.branchSourceCards.push(newBranchCard);
      this.addBranchSourceConnection(currentModuleSet, newBranchCard, moduleSetIndex);
      
      // 更新所有模組組的位置（因為該模組組高度可能改變）
      this.updateAllModuleSetPositions();
      
      console.log(`已在模組 ${moduleSetIndex} 中添加分支源頭資訊卡片`);
    },
    
    /**
     * 創建分支源頭資訊卡片
     * @param {Object} branchData - 分支數據
     * @param {Object} moduleSet - 模組組對象
     * @returns {Object} 新的分支卡片對象
     */
    createBranchSourceCard(branchData, moduleSet) {
      const existingBranchCount = moduleSet.branchSourceCards.length;
      const branchCardHeight = this.getCardHeight('branch-source');
      
      // 計算新分支卡片的位置
      const sourceCardBottomY = moduleSet.source.position.y + this.getCardHeight('source');
      const existingBranchesHeight = existingBranchCount * (branchCardHeight + BRANCH_SPACING);
      const branchY = sourceCardBottomY + existingBranchesHeight + BRANCH_SPACING;
      
      return {
        id: `branch-source-card-${Date.now()}`,
        type: 'branch-source',
        position: { x: branchData.position.x, y: branchY },
        data: {
          title: '',
          pipelineType: '',
          gasType: '',
          valveNumber: '',
          sourceSize: '',
          doubleSleeveSize: '',
          connectorSpec: 'WELD',
          locationInfo: '',
          heatInsulation: false
        }
      };
    },
    
    /**
     * 處理刪除分支源頭資訊事件
     * @param {Object} branchData - 分支數據
     */
    handleDeleteBranchSource(branchData) {
      console.log('刪除分支源頭資訊:', branchData);
      
      this.showConfirmPopup('是否確定刪除此分支源頭資訊?', () => {
        this.closePopup();
        for (let moduleIndex = 0; moduleIndex < this.allModuleSets.length; moduleIndex++) {
          const moduleSet = this.allModuleSets[moduleIndex];
          
          if (moduleSet.branchSourceCards?.length > 0) {
            const branchIndex = moduleSet.branchSourceCards.findIndex(branchCard => 
              branchCard.position.x === branchData.position.x && 
              branchCard.position.y === branchData.position.y
            );
            
            if (branchIndex !== -1) {
              moduleSet.branchSourceCards.splice(branchIndex, 1);
              this.removeBranchSourceConnection(moduleSet, branchIndex);
              
              // 更新所有模組組的位置（因為該模組組高度可能改變）
              this.updateAllModuleSetPositions();
              
              console.log(`已從模組 ${moduleIndex} 中刪除分支源頭資訊卡片`);
              return;
            }
          }
        }
        
      }, () => {
        this.closePopup();
      }); 
    
      
      console.error('找不到要刪除的分支源頭資訊卡片');
    },
    // ==================== 連接線管理 ====================
    /**
     * 添加分支源頭資訊的連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {Object} branchCard - 分支卡片對象
     * @param {number} moduleSetIndex - 模組組索引
     */
    addBranchSourceConnection(moduleSet, branchCard, moduleSetIndex) {
      console.log('添加分支源頭資訊連接線');
      
      const sourceToPipelineConnection = moduleSet.connections.find(conn => 
      conn.from === 'source' && (conn.to === 'pipeline' || conn.to === 'valve')

      );
      
      if (!sourceToPipelineConnection) {
        console.error('找不到源頭資訊到管線的連接線');
        return;
      }
      
      const connectionPositions = this.calculateBranchConnectionPositions(moduleSet, branchCard);
      
      const branchConnection = {
        from: 'branch-source-connection',
        to: 'branch-source',
        showAdditionalIcon: false,
        showFaIcon: false,
        branchCardIndex: moduleSet.branchSourceCards.length - 1,
        moduleSetIndex: moduleSetIndex,
        fromPosition: connectionPositions.from,
        toPosition: connectionPositions.to
      };
      
      moduleSet.connections.push(branchConnection);
      console.log('已添加分支源頭資訊連接線:', branchConnection);
    },
    
    /**
     * 計算分支連接線的位置
     * @param {Object} moduleSet - 模組組對象
     * @param {Object} branchCard - 分支卡片對象
     * @returns {Object} 包含 from 和 to 位置的對象
     */
    calculateBranchConnectionPositions(moduleSet, branchCard) {
      const sourceCard = moduleSet.source;
      const pipelineCard = moduleSet.pipeline;
      const valveCard = moduleSet.valveCards && moduleSet.valveCards.length > 0 ? moduleSet.valveCards[0] : null;
      
      // 源頭資訊到管線連接線的起始點
      const connectionStartX = sourceCard.position.x + CARD_WIDTH;
      const connectionStartY = sourceCard.position.y + CARD_HEIGHT_OFFSET;
      let faIconX;
      // 紫色icon的位置（在連接線中間）
      if (valveCard) {
        faIconX = connectionStartX + (valveCard.position.x - connectionStartX) / 2;
      }  else {
        faIconX = connectionStartX + (pipelineCard.position.x - connectionStartX) / 2;
      }

      
      const faIconY = connectionStartY;
      
      // 分支源頭資訊卡片的右側位置
      const branchCardRightX = branchCard.position.x + CARD_WIDTH;
      const branchCardRightY = branchCard.position.y + CARD_HEIGHT_OFFSET;
      
      return {
        from: { x: faIconX - 50, y: faIconY }, // 紫色icon左側 50px
        to: { x: branchCardRightX, y: branchCardRightY } // 分支源頭資訊右側
      };
    },
    
    /**
     * 刪除分支源頭資訊的連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchIndex - 分支索引
     */
    removeBranchSourceConnection(moduleSet, branchIndex) {
      console.log('刪除分支源頭資訊連接線');
      
      const connectionIndex = moduleSet.connections.findIndex(conn => 
        conn.from === 'branch-source-connection' && 
        conn.branchCardIndex === branchIndex
      );
      
      if (connectionIndex !== -1) {
        moduleSet.connections.splice(connectionIndex, 1);
        console.log('已刪除分支源頭資訊連接線');
      } else {
        console.warn('找不到對應的分支源頭資訊連接線');
      }
    },
    
    /**
     * 根據連接找到對應的模組組索引
     * @param {Object} connection - 連接對象
     * @returns {number} 模組組索引，找不到返回 -1
     */
    findModuleSetByConnection(connection) {
      for (let i = 0; i < this.allModuleSets.length; i++) {
        const moduleSet = this.allModuleSets[i];
        if (moduleSet.connections) {
          const foundConnection = moduleSet.connections.find(conn => 
            conn.from === connection.from && 
            conn.to === connection.to &&
            conn.showAdditionalIcon === connection.showAdditionalIcon
          );
          if (foundConnection) {
            return i;
          }
        }
      }
      return -1;
    },
    // ==================== Panel+Equipment 管理 ====================
    /**
     * 添加 Panel+Equipment 模組
     * @param {Object} connConfig - 連接配置
     * @param {number} moduleSetIndex - 模組組索引
     */
    addPanelEquipmentModule(connConfig, moduleSetIndex) {
      console.log('添加 Panel+Equipment 模組，模組組索引:', moduleSetIndex);
      
      if (moduleSetIndex < 0 || moduleSetIndex >= this.allModuleSets.length) {
        console.error('無效的模組組索引:', moduleSetIndex);
        return;
      }
      
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      
      if (!currentModuleSet?.panelEquipmentGroups?.length) {
        console.error('找不到當前的 Panel+Equipment 群組');
        return;
      }
      
      const newGroup = this.createPanelEquipmentGroup(currentModuleSet);
      currentModuleSet.panelEquipmentGroups.push(newGroup);
      this.addConnectionLinesForNewGroup(currentModuleSet, newGroup, moduleSetIndex);
      
      // 更新所有分支閥件的位置
      this.updateAllBranchValvePositions(currentModuleSet);
      
      // 更新設備卡片的連接線位置
      this.updateAdditionalEquipmentConnectionLines(currentModuleSet, -1);
      
      // 更新所有模組組的位置（因為該模組組高度可能改變）
      this.updateAllModuleSetPositions();
      
      console.log('已添加 Panel+Equipment 群組:', newGroup);
    },
    
    /**
     * 創建新的 Panel+Equipment 群組
     * @param {Object} moduleSet - 模組組對象
     * @returns {Object} 新的群組對象
     */
    createPanelEquipmentGroup(moduleSet) {
      const lastGroup = moduleSet.panelEquipmentGroups[moduleSet.panelEquipmentGroups.length - 1];
      
      // 找到該群組中最底部的設備卡片位置
      let maxBottomY = lastGroup.equipment.position.y + this.getCardHeight('equipment');
      
      // 如果有額外的設備卡片，檢查它們的最底部位置
      if (lastGroup.additionalEquipmentCards && lastGroup.additionalEquipmentCards.length > 0) {
        lastGroup.additionalEquipmentCards.forEach(card => {
          const cardBottomY = card.position.y + this.getCardHeight('equipment');
          maxBottomY = Math.max(maxBottomY, cardBottomY);
        });
      }
      
      const baseX = lastGroup.panel.position.x;
      const baseY = maxBottomY + PANEL_EQUIPMENT_GROUP_SPACING;
      
      return {
        id: `panel-equipment-group-${Date.now()}`,
        panel: { position: { x: baseX, y: baseY } },
        equipment: { position: { x: baseX + 430, y: baseY } }, // Panel 和 Equipment 之間間距 430px
        additionalEquipmentCards: []
      };
    },
    
    /**
     * 計算加號圖標位置（考慮閥件插入後的佈局）
     * @param {Object} moduleSet - 模組組對象
     * @returns {number} 加號圖標的 X 位置
     */
    calculateAdditionalIconPosition(moduleSet) {
      const firstPanelCard = moduleSet.panelEquipmentGroups[0].panel;
      return firstPanelCard.position.x - CARD_WIDTH - 30;
    },
    
    /**
     * 為新群組添加連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {Object} newGroup - 新群組對象
     * @param {number} moduleSetIndex - 模組組索引
     */
    addConnectionLinesForNewGroup(moduleSet, newGroup, moduleSetIndex) {
      const groupIndex = moduleSet.panelEquipmentGroups.length - 1;
      const iconPosition = this.calculateAdditionalIconPosition(moduleSet);
      
      // 創建從加號位置到新 panel 的連接線
      moduleSet.connections.push({
        from: 'additional-icon',
        to: 'panel',
        showAdditionalIcon: false,
        showFaIcon: false,
        groupIndex: groupIndex,
        moduleSetIndex: moduleSetIndex,
        fromPosition: { x: iconPosition, y: moduleSet.floor.position.y }
      });
      
      // 從 panel 連接到 equipment（群組內部連接）
      moduleSet.connections.push({
        from: 'panel',
        to: 'equipment',
        showAdditionalIcon: true,
        showFaIcon: true,
        groupIndex: groupIndex,
        moduleSetIndex: moduleSetIndex
      });
      
      console.log('已為新群組添加連接線，群組索引:', groupIndex, '起始點:', `(${iconPosition}, ${moduleSet.floor.position.y})`);
    },
    
    /**
     * 為分支添加 Panel+Equipment 模組
     * @param {Object} connConfig - 連接配置
     * @param {number} moduleSetIndex - 模組組索引
     */
    addBranchPanelEquipmentModule(connConfig, moduleSetIndex) {
      console.log('為分支添加 Panel+Equipment 模組，模組組索引:', moduleSetIndex);
      
      if (moduleSetIndex < 0 || moduleSetIndex >= this.allModuleSets.length) {
        console.error('無效的模組組索引:', moduleSetIndex);
        return;
      }
      
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      const branchModuleIndex = connConfig.branchModuleIndex;
      const branchModule = currentModuleSet.branchModuleCards[branchModuleIndex];
      
      if (!branchModule?.panelEquipmentGroups?.length) {
        console.error('找不到當前的 Panel+Equipment 群組');
        return;
      }
      
      const newGroup = this.createBranchPanelEquipmentGroup(branchModule);
      branchModule.panelEquipmentGroups.push(newGroup);
      this.addBranchConnectionLinesForNewGroup(currentModuleSet, branchModule, newGroup, moduleSetIndex, branchModuleIndex);
      
      // 更新所有分支閥件的位置（因為新增的群組可能會影響其他分支的位置）
      this.updateAllBranchValvePositions(currentModuleSet);
      
      // 更新設備卡片的連接線位置
      this.updateAdditionalEquipmentConnectionLines(currentModuleSet, branchModuleIndex);
      
      console.log('已為分支添加 Panel+Equipment 群組:', newGroup);
    },
    
    /**
     * 創建分支的新 Panel+Equipment 群組
     * @param {Object} branchModule - 分支模組對象
     * @returns {Object} 新的群組對象
     */
    createBranchPanelEquipmentGroup(branchModule) {
      const lastGroup = branchModule.panelEquipmentGroups[branchModule.panelEquipmentGroups.length - 1];
      
      // 找到該群組中最底部的設備卡片位置
      let maxBottomY = lastGroup.equipment.position.y + this.getCardHeight('equipment');
      
      // 如果有額外的設備卡片，檢查它們的最底部位置
      if (lastGroup.additionalEquipmentCards && lastGroup.additionalEquipmentCards.length > 0) {
        lastGroup.additionalEquipmentCards.forEach(card => {
          const cardBottomY = card.position.y + this.getCardHeight('equipment');
          maxBottomY = Math.max(maxBottomY, cardBottomY);
        });
      }
      
      const baseX = lastGroup.panel.position.x;
      const baseY = maxBottomY + PANEL_EQUIPMENT_GROUP_SPACING;
      
      return {
        id: `branch-panel-equipment-group-${Date.now()}`,
        panel: {
          id: `branch-panel-card-${Date.now()}`,
          type: 'branch-panel',
          position: { x: baseX, y: baseY }
        },
        equipment: {
          id: `branch-equipment-card-${Date.now()}`,
          type: 'branch-equipment',
          position: { x: baseX + 430, y: baseY }
        },
        additionalEquipmentCards: []
      };
    },
    
    /**
     * 為分支的新群組添加連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {Object} branchModule - 分支模組對象
     * @param {Object} newGroup - 新群組對象
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} branchModuleIndex - 分支模組索引
     */
    addBranchConnectionLinesForNewGroup(moduleSet, branchModule, newGroup, moduleSetIndex, branchModuleIndex) {
      const groupIndex = branchModule.panelEquipmentGroups.length - 1;
      
      // 計算原始 floor → panel 連接線上 add icon 的位置
      // 基於第一個 panel（index 0）的位置計算
      const firstPanel = branchModule.panelEquipmentGroups[0].panel;
      const floorRight = branchModule.floor.position.x + CARD_WIDTH;
      const floorY = branchModule.floor.position.y + CARD_HEIGHT_OFFSET;
      const firstPanelLeft = firstPanel.position.x;
      
      // 計算 add icon 的位置（與 ConnectionLine 組件中的邏輯一致）
      const midX = floorRight + (firstPanelLeft - floorRight) * 0.9;
      const iconX = floorRight + (midX - floorRight) * 0.33;
      const iconY = floorY;
      
      // add icon 寬度是 32px，從圖標右側開始（+16px 到圖標中心，再處理實際右邊）
      const newConnectionStartX = iconX + 39; // 圖標中心在 iconX，右邊在 iconX + 16
      
      // 從 add icon 右側連接到 panel（這個連接線不需要 add icon）
      moduleSet.connections.push({
        from: 'branch-floor',
        to: 'branch-panel',
        showAdditionalIcon: false,
        showFaIcon: false,
        branchModuleIndex: branchModuleIndex,
        panelEquipmentGroupIndex: groupIndex,
        moduleSetIndex: moduleSetIndex,
        fromPosition: { x: newConnectionStartX, y: iconY }
      });
      
      // 從 panel 連接到 equipment（群組內部連接）
      moduleSet.connections.push({
        from: 'branch-panel',
        to: 'branch-equipment',
        showAdditionalIcon: true,
        showFaIcon: true,
        branchModuleIndex: branchModuleIndex,
        panelEquipmentGroupIndex: groupIndex,
        moduleSetIndex: moduleSetIndex
      });
      
      console.log('已為分支新群組添加連接線，群組索引:', groupIndex, '起始點:', `(${newConnectionStartX}, ${iconY})`, 'iconX:', iconX);
    },
    
    // ==================== 設備卡片管理 ====================
    /**
     * 添加設備卡片（在同一個 panel 下）
     * @param {Object} connConfig - 連接配置
     * @param {number} moduleSetIndex - 模組組索引
     */
    addEquipmentCard(connConfig, moduleSetIndex) {
      console.log('添加設備卡片到 Panel');
      
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      if (!currentModuleSet) {
        console.error('找不到對應的模組組');
        return;
      }
      
      const groupIndex = connConfig.groupIndex !== undefined ? connConfig.groupIndex : 0;
      const currentGroup = currentModuleSet.panelEquipmentGroups[groupIndex];
      
      if (!currentGroup) {
        console.error('找不到對應的 Panel+Equipment 群組');
        return;
      }
      
      // 計算新設備卡片的位置（在現有設備下方）
      const equipmentCardHeight = this.getCardHeight('equipment');
      let newEquipmentY = currentGroup.equipment.position.y + equipmentCardHeight + 50;
      
      // 如果已經有其他額外的設備卡片，使用最後一個設備卡片的位置
      if (currentGroup.additionalEquipmentCards && currentGroup.additionalEquipmentCards.length > 0) {
        const lastAdditionalCard = currentGroup.additionalEquipmentCards[currentGroup.additionalEquipmentCards.length - 1];
        newEquipmentY = lastAdditionalCard.position.y + equipmentCardHeight + 50;
      }
      
      const newEquipmentCard = {
        id: `equipment-card-${Date.now()}`,
        position: { x: currentGroup.equipment.position.x, y: newEquipmentY },
        data: {
          gasType: '',
          size: '',
          connector: '',
          connectionName: '',
          threeInOne: ''
        }
      };
      
      // 初始化 additionalEquipmentCards 數組
      if (!currentGroup.additionalEquipmentCards) {
        currentGroup.additionalEquipmentCards = [];
      }
      
      currentGroup.additionalEquipmentCards.push(newEquipmentCard);
      
      // 添加連接線
      this.addEquipmentConnectionLine(currentModuleSet, groupIndex, newEquipmentCard, moduleSetIndex);
      
      // 更新主分支後續群組位置（避免與新添加的設備卡片重疊）
      this.updateSubsequentPanelEquipmentGroups(currentModuleSet, groupIndex);
      
      // 更新所有分支閥件的位置
      this.updateAllBranchValvePositions(currentModuleSet);
      
      // 確保更新所有分支的設備卡片連接線（因為分支位置可能已改變）
      // 需要在 updateAllBranchValvePositions 之後再次更新，確保所有位置都是最新的
      if (currentModuleSet.branchModuleCards && currentModuleSet.branchModuleCards.length > 0) {
        console.log(`主分支添加設備後，強制更新所有 ${currentModuleSet.branchModuleCards.length} 個分支的設備卡片連接線`);
        currentModuleSet.branchModuleCards.forEach((branchModule, branchIndex) => {
          console.log(`[主分支添加設備] 更新分支 ${branchIndex} 的設備卡片連接線`);
          this.updateAdditionalEquipmentConnectionLines(currentModuleSet, branchIndex);
        });
      }
      
      // 更新所有模組組的位置（因為該模組組高度可能改變）
      this.updateAllModuleSetPositions();
      
      console.log('已添加設備卡片:', newEquipmentCard);
    },
    
    /**
     * 添加設備卡片（有閥件的情況）
     * @param {Object} connConfig - 連接配置
     * @param {number} moduleSetIndex - 模組組索引
     */
    addEquipmentCardWithValve(connConfig, moduleSetIndex) {
      console.log('添加設備卡片到 Panel（有閥件的情況）');
      
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      if (!currentModuleSet) {
        console.error('找不到對應的模組組');
        return;
      }
      
      const groupIndex = connConfig.groupIndex !== undefined ? connConfig.groupIndex : 0;
      const currentGroup = currentModuleSet.panelEquipmentGroups[groupIndex];
      
      if (!currentGroup) {
        console.error('找不到對應的 Panel+Equipment 群組');
        return;
      }

      if (!currentGroup.valve) {
        console.error('找不到閥件');
        return;
      }

      // 計算新設備卡片的位置（從閥件位置開始計算）
      const equipmentCardHeight = this.getCardHeight('equipment');
      let newEquipmentY = currentGroup.equipment.position.y + equipmentCardHeight + 50;
      
      // 如果已經有其他額外的設備卡片，使用最後一個設備卡片的位置
      if (currentGroup.additionalEquipmentCards && currentGroup.additionalEquipmentCards.length > 0) {
        const lastAdditionalCard = currentGroup.additionalEquipmentCards[currentGroup.additionalEquipmentCards.length - 1];
        newEquipmentY = lastAdditionalCard.position.y + equipmentCardHeight + 50;
      }
      
      // 從閥件右側開始，間距 86px
      const newEquipmentCard = {
        id: `equipment-card-${Date.now()}`,
        position: { x: currentGroup.valve.position.x + 318, y: newEquipmentY },
        data: {
          gasType: '',
          size: '',
          connector: '',
          connectionName: '',
          threeInOne: ''
        }
      };
      
      // 初始化 additionalEquipmentCards 數組
      if (!currentGroup.additionalEquipmentCards) {
        currentGroup.additionalEquipmentCards = [];
      }
      
      currentGroup.additionalEquipmentCards.push(newEquipmentCard);
      
      // 添加連接線（從閥件連接到新設備）
      this.addEquipmentConnectionLineWithValve(currentModuleSet, groupIndex, newEquipmentCard, moduleSetIndex);
      
      // 更新主分支後續群組位置（避免與新添加的設備卡片重疊）
      this.updateSubsequentPanelEquipmentGroups(currentModuleSet, groupIndex);
      
      // 更新所有分支閥件的位置
      this.updateAllBranchValvePositions(currentModuleSet);
      
      // 確保更新所有分支的設備卡片連接線（因為分支位置可能已改變）
      // 需要在 updateAllBranchValvePositions 之後再次更新，確保所有位置都是最新的
      if (currentModuleSet.branchModuleCards && currentModuleSet.branchModuleCards.length > 0) {
        console.log(`主分支添加設備後，強制更新所有 ${currentModuleSet.branchModuleCards.length} 個分支的設備卡片連接線`);
        currentModuleSet.branchModuleCards.forEach((branchModule, branchIndex) => {
          console.log(`[主分支添加設備] 更新分支 ${branchIndex} 的設備卡片連接線`);
          this.updateAdditionalEquipmentConnectionLines(currentModuleSet, branchIndex);
        });
      }
      
      // 更新所有模組組的位置（因為該模組組高度可能改變）
      this.updateAllModuleSetPositions();
      
      console.log('已添加設備卡片:', newEquipmentCard);
    },

    /**
     * 添加分支設備卡片
     * @param {Object} connConfig - 連接配置
     * @param {number} moduleSetIndex - 模組組索引
     */
    addBranchEquipmentCard(connConfig, moduleSetIndex) {
      console.log('為分支添加設備卡片');
      
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      if (!currentModuleSet) {
        console.error('找不到對應的模組組');
        return;
      }
      
      const branchModuleIndex = connConfig.branchModuleIndex;
      const branchModule = currentModuleSet.branchModuleCards[branchModuleIndex];
      const groupIndex = connConfig.panelEquipmentGroupIndex !== undefined ? connConfig.panelEquipmentGroupIndex : 0;
      const currentGroup = branchModule.panelEquipmentGroups[groupIndex];
      
      if (!currentGroup) {
        console.error('找不到對應的分支 Panel+Equipment 群組');
        return;
      }
      
      // 確保與主分支對應位置的設備卡片對齊（閥件對閥件、設備對設備）
      const mainGroup = currentModuleSet.panelEquipmentGroups[groupIndex];
      let targetX = currentGroup.equipment.position.x;
      let targetY;
      
      // 計算新設備卡片在分支中的索引
      const newCardIndex = currentGroup.additionalEquipmentCards ? currentGroup.additionalEquipmentCards.length : 0;
      
      // 檢查主分支是否有對應索引位置的設備卡片
      if (mainGroup && mainGroup.additionalEquipmentCards && 
          newCardIndex < mainGroup.additionalEquipmentCards.length) {
        // 主分支有對應位置的設備卡片，使用其位置對齊（X和Y都對齊）
        const mainEquipmentCard = mainGroup.additionalEquipmentCards[newCardIndex];
        targetX = mainEquipmentCard.position.x;
        targetY = mainEquipmentCard.position.y; // 設備對設備：Y軸對齊
      } else if (mainGroup && mainGroup.additionalEquipmentCards && mainGroup.additionalEquipmentCards.length > 0) {
        // 主分支有設備卡片但沒有對應索引的卡片，使用最後一個主分支設備卡片的位置來計算
        // 確保分支設備卡片與主分支最後一個設備卡片對齊（保持相同的Y位置模式）
        const lastMainCard = mainGroup.additionalEquipmentCards[mainGroup.additionalEquipmentCards.length - 1];
        const equipmentCardHeight = this.getCardHeight('equipment');
        const spacing = 50;
        // 計算主分支最後一個設備卡片到下一個應該出現的位置
        const mainNextY = lastMainCard.position.y + equipmentCardHeight + spacing;
        targetX = lastMainCard.position.x;
        targetY = mainNextY; // 與主分支保持相同的間距模式
      } else {
        // 如果主分支沒有任何設備卡片，計算新設備卡片的位置（在現有設備下方）
        const equipmentCardHeight = this.getCardHeight('equipment');
        targetY = currentGroup.equipment.position.y + equipmentCardHeight + 50;
        
        // 如果已經有其他額外的設備卡片，使用最後一個設備卡片的位置
        if (currentGroup.additionalEquipmentCards && currentGroup.additionalEquipmentCards.length > 0) {
          const lastAdditionalCard = currentGroup.additionalEquipmentCards[currentGroup.additionalEquipmentCards.length - 1];
          targetY = lastAdditionalCard.position.y + equipmentCardHeight + 50;
        }
      }
      
      const newEquipmentCard = {
        id: `branch-equipment-card-${Date.now()}`,
        position: { x: targetX, y: targetY },
        data: {
          gasType: '',
          size: '',
          connector: '',
          connectionName: '',
          threeInOne: ''
        }
      };
      
      // 初始化 additionalEquipmentCards 數組
      if (!currentGroup.additionalEquipmentCards) {
        currentGroup.additionalEquipmentCards = [];
      }
      
      currentGroup.additionalEquipmentCards.push(newEquipmentCard);
      
      // 添加連接線
      this.addBranchEquipmentConnectionLine(currentModuleSet, branchModuleIndex, groupIndex, newEquipmentCard, moduleSetIndex);
      
      // 更新所有分支閥件的位置
      this.updateAllBranchValvePositions(currentModuleSet);
      
      // 更新所有模組組的位置（因為該模組組高度可能改變）
      this.updateAllModuleSetPositions();
      
      console.log('已為分支添加設備卡片:', newEquipmentCard);
    },
    
    /**
     * 處理刪除 Panel+Equipment 群組事件
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} groupIndex - 群組索引
     * @param {Object} data - 卡片數據
     */
    handleDeletePanelGroup(moduleSetIndex, groupIndex, data) {
      console.log('刪除 Panel+Equipment 群組:', { moduleSetIndex, groupIndex });
      
      this.showConfirmPopup('是否確定刪除此盤面?', () => {
        this.deletePanelEquipmentGroup(moduleSetIndex, groupIndex);
        this.closePopup();
      }, () => {
        this.closePopup();
      });
    },
    
    /**
     * 刪除 Panel+Equipment 群組
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} groupIndex - 群組索引
     */
    deletePanelEquipmentGroup(moduleSetIndex, groupIndex) {
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      
      if (!currentModuleSet || !currentModuleSet.panelEquipmentGroups || groupIndex === 0) {
        console.error('無法刪除第一個群組或找不到群組');
        return;
      }
      
      // 刪除相關連接線
      this.removePanelEquipmentGroupConnections(currentModuleSet, groupIndex);
      
      // 刪除群組
      currentModuleSet.panelEquipmentGroups.splice(groupIndex, 1);
      
      // 重新計算並更新被刪除群組之後的群組位置（向上移動）
      // 只更新索引 >= groupIndex 的群組（刪除後這些群組的索引都減1了）
      this.reorganizePanelEquipmentGroupsAfterDelete(currentModuleSet, groupIndex);
      
      // 更新所有分支閥件的位置
      this.updateAllBranchValvePositions(currentModuleSet);
      
      // 更新設備卡片的連接線位置
      this.updateAdditionalEquipmentConnectionLines(currentModuleSet, -1);
      
      // 更新所有模組組的位置（因為該模組組高度可能改變）
      this.updateAllModuleSetPositions();
      
      console.log(`已刪除 Panel+Equipment 群組 ${groupIndex}`);
    },
    
    /**
     * 處理刪除額外設備卡片事件（主面板）
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} groupIndex - 群組索引
     * @param {number} cardIndex - 卡片索引
     * @param {Object} data - 卡片數據
     */
    handleDeleteAdditionalEquipmentCard(moduleSetIndex, groupIndex, cardIndex, data) {
      console.log('刪除額外設備卡片:', { moduleSetIndex, groupIndex, cardIndex });
      
      this.showConfirmPopup('是否確定刪除此設備?', () => {
        this.deleteAdditionalEquipmentCard(moduleSetIndex, groupIndex, cardIndex);
        this.closePopup();
      }, () => {
        this.closePopup();
      });
    },
    
    /**
     * 刪除額外設備卡片（主面板）
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} groupIndex - 群組索引
     * @param {number} cardIndex - 卡片索引
     */
    deleteAdditionalEquipmentCard(moduleSetIndex, groupIndex, cardIndex) {
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      const currentGroup = currentModuleSet.panelEquipmentGroups[groupIndex];
      
      if (!currentGroup || !currentGroup.additionalEquipmentCards || 
          cardIndex >= currentGroup.additionalEquipmentCards.length) {
        console.error('找不到要刪除的設備卡片');
        return;
      }
      
      // 刪除相關連接線
      this.removeAdditionalEquipmentCardConnection(currentModuleSet, groupIndex, cardIndex);
      
      // 刪除設備卡片
      currentGroup.additionalEquipmentCards.splice(cardIndex, 1);
      
      // 更新剩餘連接線的索引
      this.updateAdditionalEquipmentCardIndices(currentModuleSet, groupIndex, cardIndex);
      
      // 重新計算並更新被刪除卡片之後的設備卡片位置（向上移動）
      this.reorganizeAdditionalEquipmentCardsAfterDelete(currentModuleSet, currentGroup, groupIndex, cardIndex);
      
      // 更新主分支後續群組位置（因為刪除設備卡片後群組高度減少，後續群組應向上移動）
      this.updateSubsequentPanelEquipmentGroupsAfterDelete(currentModuleSet, groupIndex);
      
      // 更新所有分支閥件的位置
      this.updateAllBranchValvePositions(currentModuleSet);
      
      // 更新設備卡片的連接線位置
      this.updateAdditionalEquipmentConnectionLines(currentModuleSet, -1);
      
      // 更新所有模組組的位置（因為該模組組高度可能改變）
      this.updateAllModuleSetPositions();
      
      console.log(`已刪除設備卡片 ${cardIndex}`);
    },
    
    /**
     * 處理刪除分支 Panel+Equipment 群組事件
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     * @param {Object} data - 卡片數據
     */
    handleDeleteBranchPanelGroup(moduleSetIndex, branchModuleIndex, groupIndex, data) {
      console.log('刪除分支 Panel+Equipment 群組:', { moduleSetIndex, branchModuleIndex, groupIndex });
      
      this.showConfirmPopup('是否確定刪除此分支盤面?', () => {
        this.deleteBranchPanelEquipmentGroup(moduleSetIndex, branchModuleIndex, groupIndex);
        this.closePopup();
      }, () => {
        this.closePopup();
      });
    },
    
    /**
     * 刪除分支 Panel+Equipment 群組
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     */
    deleteBranchPanelEquipmentGroup(moduleSetIndex, branchModuleIndex, groupIndex) {
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      const branchModule = currentModuleSet.branchModuleCards[branchModuleIndex];
      
      if (!branchModule || !branchModule.panelEquipmentGroups || groupIndex === 0) {
        console.error('無法刪除第一個群組或找不到群組');
        return;
      }
      
      // 刪除相關連接線
      this.removeBranchPanelEquipmentGroupConnections(currentModuleSet, branchModuleIndex, groupIndex);
      
      // 刪除群組
      branchModule.panelEquipmentGroups.splice(groupIndex, 1);
      
      // 重新計算並更新被刪除群組之後的群組位置（向上移動）
      // 只更新索引 >= groupIndex 的群組（刪除後這些群組的索引都減1了）
      this.reorganizeBranchPanelEquipmentGroupsAfterDelete(branchModule, groupIndex);
      
      // 更新所有分支閥件的位置
      this.updateAllBranchValvePositions(currentModuleSet);
      
      // 更新該分支的設備卡片連接線位置
      this.updateAdditionalEquipmentConnectionLines(currentModuleSet, branchModuleIndex);
      
      // 更新所有模組組的位置（因為該模組組高度可能改變）
      this.updateAllModuleSetPositions();
      
      console.log(`已刪除分支 Panel+Equipment 群組 ${groupIndex}`);
    },
    
    /**
     * 處理刪除分支額外設備卡片事件
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     * @param {number} cardIndex - 卡片索引
     * @param {Object} data - 卡片數據
     */
    handleDeleteBranchAdditionalEquipmentCard(moduleSetIndex, branchModuleIndex, groupIndex, cardIndex, data) {
      console.log('刪除分支額外設備卡片:', { moduleSetIndex, branchModuleIndex, groupIndex, cardIndex });
      
      this.showConfirmPopup('是否確定刪除此設備?', () => {
        this.deleteBranchAdditionalEquipmentCard(moduleSetIndex, branchModuleIndex, groupIndex, cardIndex);
        this.closePopup();
      }, () => {
        this.closePopup();
      });
    },
    
    /**
     * 刪除分支額外設備卡片
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     * @param {number} cardIndex - 卡片索引
     */
    deleteBranchAdditionalEquipmentCard(moduleSetIndex, branchModuleIndex, groupIndex, cardIndex) {
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      const branchModule = currentModuleSet.branchModuleCards[branchModuleIndex];
      const currentGroup = branchModule.panelEquipmentGroups[groupIndex];
      
      if (!currentGroup || !currentGroup.additionalEquipmentCards || 
          cardIndex >= currentGroup.additionalEquipmentCards.length) {
        console.error('找不到要刪除的設備卡片');
        return;
      }
      
      // 刪除相關連接線
      this.removeBranchAdditionalEquipmentCardConnection(currentModuleSet, branchModuleIndex, groupIndex, cardIndex);
      
      // 刪除設備卡片
      currentGroup.additionalEquipmentCards.splice(cardIndex, 1);
      
      // 更新剩餘連接線的索引
      this.updateBranchAdditionalEquipmentCardIndices(currentModuleSet, branchModuleIndex, groupIndex, cardIndex);
      
      // 重新計算並更新被刪除卡片之後的設備卡片位置（向上移動）
      this.reorganizeBranchAdditionalEquipmentCardsAfterDelete(currentModuleSet, currentGroup, branchModuleIndex, groupIndex, cardIndex);
      
      // 更新所有分支閥件的位置
      this.updateAllBranchValvePositions(currentModuleSet);
      
      // 更新該分支的設備卡片連接線位置
      this.updateAdditionalEquipmentConnectionLines(currentModuleSet, branchModuleIndex);
      
      // 更新所有模組組的位置（因為該模組組高度可能改變）
      this.updateAllModuleSetPositions();
      
      console.log(`已刪除分支設備卡片 ${cardIndex}`);
    },
    
    /**
     * 為新增的設備卡片添加連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - 群組索引
     * @param {Object} newEquipmentCard - 新的設備卡片對象
     * @param {number} moduleSetIndex - 模組組索引
     */
    addEquipmentConnectionLine(moduleSet, groupIndex, newEquipmentCard, moduleSetIndex) {
      const currentGroup = moduleSet.panelEquipmentGroups[groupIndex];
      
      // 計算連接線起始位置（在 panel 到 equipment 連接線上的 add icon 和 purple icon 之間）
      const panelRightX = currentGroup.panel.position.x + CARD_WIDTH;
      const panelY = currentGroup.panel.position.y + CARD_HEIGHT_OFFSET;
      const equipmentLeftX = currentGroup.equipment.position.x;
      
      // 計算 add icon 的位置（panel 和 equipment 之間）
      const midX = panelRightX + (equipmentLeftX - panelRightX) * 0.9;
      const iconX = panelRightX + (midX - panelRightX) * 0.33;
      
      // 計算紫色圖標的位置
      const purpleIconX = panelRightX + (equipmentLeftX - panelRightX) * 0.67;
      
      // 連接線從 add icon 和 purple icon 之間的位置開始（選擇兩者中間）
      const connectionStartX = (iconX + purpleIconX) / 2;
      const connectionStartY = panelY;
      
      // 連接線終點在設備卡片左側
      const equipmentCardHeight = this.getCardHeight('equipment');
      const connectionEndX = newEquipmentCard.position.x;
      const connectionEndY = newEquipmentCard.position.y + CARD_HEIGHT_OFFSET;
      
      // 添加連接線配置
      moduleSet.connections.push({
        from: 'panel-equipment-connection',
        to: 'additional-equipment',
        showAdditionalIcon: false,
        showFaIcon: true,
        groupIndex: groupIndex,
        moduleSetIndex: moduleSetIndex,
        equipmentCardIndex: currentGroup.additionalEquipmentCards.length - 1,
        fromPosition: { x: connectionStartX, y: connectionStartY },
        toPosition: { x: connectionEndX, y: connectionEndY }
      });
      
      console.log('已添加設備卡片連接線，起始點:', `(${connectionStartX}, ${connectionStartY})`, '終點:', `(${connectionEndX}, ${connectionEndY})`);
    },

    /**
     * 為有閥件的情況添加設備卡片連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - Panel+Equipment 群組索引
     * @param {Object} newEquipmentCard - 新的設備卡片對象
     * @param {number} moduleSetIndex - 模組組索引
     */
    addEquipmentConnectionLineWithValve(moduleSet, groupIndex, newEquipmentCard, moduleSetIndex) {
      const currentGroup = moduleSet.panelEquipmentGroups[groupIndex];
      
      if (!currentGroup.valve) {
        console.error('找不到閥件');
        return;
      }

      // 連接線起始位置：panel → valve 連接線上的位置
      const panelRightX = currentGroup.panel.position.x + CARD_WIDTH;
      const panelY = currentGroup.panel.position.y + CARD_HEIGHT_OFFSET;
      const valveLeftX = currentGroup.valve.position.x;
      
      // 計算 add icon 的位置（panel 和 valve 之間）
      const midX = panelRightX + (valveLeftX - panelRightX) * 0.9;
      const iconX = panelRightX + (midX - panelRightX) * 0.33;
      
      // 計算紫色圖標的位置
      const purpleIconX = panelRightX + (valveLeftX - panelRightX) * 0.67;
      
      // 連接線從 add icon 和 purple icon 之間的位置開始（選擇兩者中間）
      const connectionStartX = (iconX + purpleIconX) / 2;
      const connectionStartY = panelY;
      
      // 連接線終點在設備卡片左側
      const equipmentCardHeight = this.getCardHeight('equipment');
      const connectionEndX = newEquipmentCard.position.x;
      const connectionEndY = newEquipmentCard.position.y + CARD_HEIGHT_OFFSET;
      
      // 添加連接線配置
      moduleSet.connections.push({
        from: 'panel-equipment-valve',
        to: 'additional-equipment',
        showAdditionalIcon: false,
        showFaIcon: true,
        groupIndex: groupIndex,
        moduleSetIndex: moduleSetIndex,
        equipmentCardIndex: currentGroup.additionalEquipmentCards.length - 1,
        fromPosition: { x: connectionStartX, y: connectionStartY },
        toPosition: { x: connectionEndX, y: connectionEndY }
      });
      
      console.log('已添加設備卡片連接線（從 panel → valve 線條），起始點:', `(${connectionStartX}, ${connectionStartY})`, '終點:', `(${connectionEndX}, ${connectionEndY})`);
    },
    
    /**
     * 為分支新增的設備卡片添加連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     * @param {Object} newEquipmentCard - 新的設備卡片對象
     * @param {number} moduleSetIndex - 模組組索引
     */
    addBranchEquipmentConnectionLine(moduleSet, branchModuleIndex, groupIndex, newEquipmentCard, moduleSetIndex) {
      const branchModule = moduleSet.branchModuleCards[branchModuleIndex];
      const currentGroup = branchModule.panelEquipmentGroups[groupIndex];
      
      // 計算連接線起始位置（在 panel 到 equipment 連接線上的 add icon 和 purple icon 之間）
      const panelRightX = currentGroup.panel.position.x + CARD_WIDTH;
      const panelY = currentGroup.panel.position.y + CARD_HEIGHT_OFFSET;
      const equipmentLeftX = currentGroup.equipment.position.x;
      
      // 計算 add icon 的位置（panel 和 equipment 之間）
      const midX = panelRightX + (equipmentLeftX - panelRightX) * 0.9;
      const iconX = panelRightX + (midX - panelRightX) * 0.33;
      
      // 計算紫色圖標的位置
      const purpleIconX = panelRightX + (equipmentLeftX - panelRightX) * 0.67;
      
      // 連接線從 add icon 和 purple icon 之間的位置開始（選擇兩者中間）
      const connectionStartX = (iconX + purpleIconX) / 2;
      const connectionStartY = panelY;
      
      // 連接線終點在設備卡片左側
      const connectionEndX = newEquipmentCard.position.x;
      const connectionEndY = newEquipmentCard.position.y + CARD_HEIGHT_OFFSET;
      
      // 添加連接線配置
      moduleSet.connections.push({
        from: 'branch-panel-equipment-connection',
        to: 'branch-additional-equipment',
        showAdditionalIcon: false,
        showFaIcon: true,
        branchModuleIndex: branchModuleIndex,
        panelEquipmentGroupIndex: groupIndex,
        moduleSetIndex: moduleSetIndex,
        equipmentCardIndex: currentGroup.additionalEquipmentCards.length - 1,
        fromPosition: { x: connectionStartX, y: connectionStartY },
        toPosition: { x: connectionEndX, y: connectionEndY }
      });
      
      console.log('已為分支添加設備卡片連接線，起始點:', `(${connectionStartX}, ${connectionStartY})`, '終點:', `(${connectionEndX}, ${connectionEndY})`);
    },
    
    /**
     * 更新主分支後續 Panel+Equipment 群組位置（避免與設備卡片重疊）
     * @param {Object} moduleSet - 模組組對象
     * @param {number} currentGroupIndex - 當前添加設備卡片的群組索引
     */
    updateSubsequentPanelEquipmentGroups(moduleSet, currentGroupIndex) {
      console.log('更新主分支後續群組位置:', { currentGroupIndex });
      
      if (!moduleSet.panelEquipmentGroups || moduleSet.panelEquipmentGroups.length <= currentGroupIndex + 1) {
        // 沒有後續群組，不需要更新
        return;
      }
      
      const currentGroup = moduleSet.panelEquipmentGroups[currentGroupIndex];
      if (!currentGroup) {
        return;
      }
      
      // 計算當前群組的最底部位置（包括所有額外設備卡片）
      let currentGroupMaxBottomY = Math.max(
        currentGroup.panel.position.y + this.getCardHeight('panel'),
        currentGroup.equipment.position.y + this.getCardHeight('equipment')
      );
      
      if (currentGroup.additionalEquipmentCards && currentGroup.additionalEquipmentCards.length > 0) {
        currentGroup.additionalEquipmentCards.forEach(card => {
          const cardBottomY = card.position.y + this.getCardHeight('equipment');
          currentGroupMaxBottomY = Math.max(currentGroupMaxBottomY, cardBottomY);
        });
      }
      
      // 檢查後續群組是否需要向下移動
      const minSpacing = PANEL_EQUIPMENT_GROUP_SPACING;
      
      for (let i = currentGroupIndex + 1; i < moduleSet.panelEquipmentGroups.length; i++) {
        const nextGroup = moduleSet.panelEquipmentGroups[i];
        const nextGroupTopY = Math.min(nextGroup.panel.position.y, nextGroup.equipment.position.y);
        
        // 如果後續群組與當前群組的底部距離太近，需要向下移動
        const requiredY = currentGroupMaxBottomY + minSpacing;
        
        if (nextGroupTopY < requiredY) {
          const offsetY = requiredY - nextGroupTopY;
          
          console.log(`群組 ${i} 需要向下移動 ${offsetY}px`);
          
          // 移動後續群組
          nextGroup.panel.position.y += offsetY;
          nextGroup.equipment.position.y += offsetY;
          
          // 如果有閥件，也移動閥件
          if (nextGroup.valve) {
            nextGroup.valve.position.y += offsetY;
          }
          
          // 更新額外設備卡片的位置
          if (nextGroup.additionalEquipmentCards && nextGroup.additionalEquipmentCards.length > 0) {
            nextGroup.additionalEquipmentCards.forEach(card => {
              card.position.y += offsetY;
            });
          }
          
          // 更新當前群組的最底部位置（用於計算下一個群組的位置）
          currentGroupMaxBottomY = Math.max(
            nextGroup.panel.position.y + this.getCardHeight('panel'),
            nextGroup.equipment.position.y + this.getCardHeight('equipment')
          );
          
          if (nextGroup.additionalEquipmentCards && nextGroup.additionalEquipmentCards.length > 0) {
            nextGroup.additionalEquipmentCards.forEach(card => {
              const cardBottomY = card.position.y + this.getCardHeight('equipment');
              currentGroupMaxBottomY = Math.max(currentGroupMaxBottomY, cardBottomY);
            });
          }
          
          // 更新該群組相關的連接線位置
          this.updatePanelEquipmentGroupConnectionLines(moduleSet, i);
        } else {
          // 如果不需要移動這個群組，後續群組也不需要移動
          break;
        }
      }
      
      console.log('已更新主分支後續群組位置');
    },
    
    /**
     * 刪除設備卡片後更新主分支後續 Panel+Equipment 群組位置（向上移動）
     * @param {Object} moduleSet - 模組組對象
     * @param {number} currentGroupIndex - 當前刪除設備卡片的群組索引
     */
    updateSubsequentPanelEquipmentGroupsAfterDelete(moduleSet, currentGroupIndex) {
      console.log('更新主分支後續群組位置（刪除設備卡片後）:', { currentGroupIndex });
      
      if (!moduleSet.panelEquipmentGroups || moduleSet.panelEquipmentGroups.length <= currentGroupIndex + 1) {
        // 沒有後續群組，不需要更新
        return;
      }
      
      const currentGroup = moduleSet.panelEquipmentGroups[currentGroupIndex];
      if (!currentGroup) {
        return;
      }
      
      // 計算當前群組的最底部位置（包括所有剩餘的額外設備卡片）
      let currentGroupMaxBottomY = Math.max(
        currentGroup.panel.position.y + this.getCardHeight('panel'),
        currentGroup.equipment.position.y + this.getCardHeight('equipment')
      );
      
      if (currentGroup.additionalEquipmentCards && currentGroup.additionalEquipmentCards.length > 0) {
        currentGroup.additionalEquipmentCards.forEach(card => {
          const cardBottomY = card.position.y + this.getCardHeight('equipment');
          currentGroupMaxBottomY = Math.max(currentGroupMaxBottomY, cardBottomY);
        });
      }
      
      // 重新計算後續群組的位置（基於當前群組的新底部位置）
      const minSpacing = PANEL_EQUIPMENT_GROUP_SPACING;
      
      for (let i = currentGroupIndex + 1; i < moduleSet.panelEquipmentGroups.length; i++) {
        const nextGroup = moduleSet.panelEquipmentGroups[i];
        const nextGroupTopY = Math.min(nextGroup.panel.position.y, nextGroup.equipment.position.y);
        
        // 計算該群組應該在的位置（基於前一個群組的最底部位置）
        const requiredY = currentGroupMaxBottomY + minSpacing;
        
        // 計算需要移動的距離
        const offsetY = requiredY - nextGroupTopY;
        
        if (Math.abs(offsetY) > 0.1) {
          console.log(`群組 ${i} 需要移動 ${offsetY}px（從 ${nextGroupTopY} 移動到 ${requiredY}）`);
          
          // 移動後續群組
          nextGroup.panel.position.y += offsetY;
          nextGroup.equipment.position.y += offsetY;
          
          // 如果有閥件，也移動閥件
          if (nextGroup.valve) {
            nextGroup.valve.position.y += offsetY;
          }
          
          // 更新額外設備卡片的位置
          if (nextGroup.additionalEquipmentCards && nextGroup.additionalEquipmentCards.length > 0) {
            nextGroup.additionalEquipmentCards.forEach(card => {
              card.position.y += offsetY;
            });
          }
          
          // 更新當前群組的最底部位置（用於計算下一個群組的位置）
          currentGroupMaxBottomY = Math.max(
            nextGroup.panel.position.y + this.getCardHeight('panel'),
            nextGroup.equipment.position.y + this.getCardHeight('equipment')
          );
          
          if (nextGroup.additionalEquipmentCards && nextGroup.additionalEquipmentCards.length > 0) {
            nextGroup.additionalEquipmentCards.forEach(card => {
              const cardBottomY = card.position.y + this.getCardHeight('equipment');
              currentGroupMaxBottomY = Math.max(currentGroupMaxBottomY, cardBottomY);
            });
          }
          
          // 更新該群組相關的連接線位置
          this.updatePanelEquipmentGroupConnectionLines(moduleSet, i);
        } else {
          // 如果不需要移動這個群組，後續群組也不需要移動（因為它們已經有足夠的間距）
          break;
        }
      }
      
      console.log('已更新主分支後續群組位置（刪除設備卡片後）');
    },
    
    /**
     * 更新特定 Panel+Equipment 群組的連接線位置
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - 群組索引
     */
    updatePanelEquipmentGroupConnectionLines(moduleSet, groupIndex) {
      const group = moduleSet.panelEquipmentGroups[groupIndex];
      if (!group) {
        return;
      }
      
      // 更新從 additional-icon 到 panel 的連接線終點
      moduleSet.connections.forEach(conn => {
        if (conn.from === 'additional-icon' && conn.to === 'panel' && conn.groupIndex === groupIndex) {
          conn.toPosition = {
            x: group.panel.position.x,
            y: group.panel.position.y + CARD_HEIGHT_OFFSET
          };
        }
        
        // 更新 panel 到 equipment 的連接線位置（沒有閥件的情況）
        if (conn.from === 'panel' && conn.to === 'equipment' && conn.groupIndex === groupIndex) {
          conn.fromPosition = {
            x: group.panel.position.x + CARD_WIDTH,
            y: group.panel.position.y + CARD_HEIGHT_OFFSET
          };
          conn.toPosition = {
            x: group.equipment.position.x,
            y: group.equipment.position.y + CARD_HEIGHT_OFFSET
          };
        }
        
        // 更新 panel 到 valve 的連接線位置（有閥件的情況）
        if (conn.from === 'panel' && conn.to === 'panel-equipment-valve' && conn.groupIndex === groupIndex) {
          conn.fromPosition = {
            x: group.panel.position.x + CARD_WIDTH,
            y: group.panel.position.y + CARD_HEIGHT_OFFSET
          };
          if (group.valve) {
            conn.toPosition = {
              x: group.valve.position.x,
              y: group.valve.position.y + CARD_HEIGHT_OFFSET
            };
          }
        }
        
        // 更新 valve 到 equipment 的連接線位置（有閥件的情況）
        if (conn.from === 'panel-equipment-valve' && conn.to === 'equipment' && conn.groupIndex === groupIndex) {
          if (group.valve) {
            conn.fromPosition = {
              x: group.valve.position.x + CARD_WIDTH,
              y: group.valve.position.y + CARD_HEIGHT_OFFSET
            };
          }
          conn.toPosition = {
            x: group.equipment.position.x,
            y: group.equipment.position.y + CARD_HEIGHT_OFFSET
          };
        }
        
        // 更新該群組的額外設備卡片連接線位置
        if ((conn.from === 'panel-equipment-connection' || conn.from === 'panel-equipment-valve') && 
            conn.groupIndex === groupIndex && 
            conn.equipmentCardIndex !== undefined) {
          const card = group.additionalEquipmentCards?.[conn.equipmentCardIndex];
          if (card) {
            // 如果有閥件且連接線從 valve 出發，需要更新 fromPosition
            if (conn.from === 'panel-equipment-valve' && group.valve) {
              const panelRightX = group.panel.position.x + CARD_WIDTH;
              const panelY = group.panel.position.y + CARD_HEIGHT_OFFSET;
              const valveLeftX = group.valve.position.x;
              
              const midX = panelRightX + (valveLeftX - panelRightX) * 0.9;
              const iconX = panelRightX + (midX - panelRightX) * 0.33;
              const purpleIconX = panelRightX + (valveLeftX - panelRightX) * 0.67;
              const connectionStartX = (iconX + purpleIconX) / 2;
              
              conn.fromPosition = {
                x: connectionStartX,
                y: panelY
              };
            } else if (conn.from === 'panel-equipment-connection') {
              // 從 panel 和 equipment 之間出發的連接線
              const panelRightX = group.panel.position.x + CARD_WIDTH;
              const panelY = group.panel.position.y + CARD_HEIGHT_OFFSET;
              const equipmentLeftX = group.equipment.position.x;
              
              const midX = panelRightX + (equipmentLeftX - panelRightX) * 0.9;
              const iconX = panelRightX + (midX - panelRightX) * 0.33;
              const purpleIconX = panelRightX + (equipmentLeftX - panelRightX) * 0.67;
              const connectionStartX = (iconX + purpleIconX) / 2;
              
              conn.fromPosition = {
                x: connectionStartX,
                y: panelY
              };
            }
            
            // 更新連接線終點
            conn.toPosition = {
              x: card.position.x,
              y: card.position.y + CARD_HEIGHT_OFFSET
            };
          }
        }
      });
    },
    
    /**
     * 刪除群組後重新組織被刪除群組之後的主分支 Panel+Equipment 群組位置（向上移動）
     * @param {Object} moduleSet - 模組組對象
     * @param {number} deletedGroupIndex - 被刪除群組的原始索引
     */
    reorganizePanelEquipmentGroupsAfterDelete(moduleSet, deletedGroupIndex) {
      console.log('重新組織主分支 Panel+Equipment 群組位置，被刪除群組索引:', deletedGroupIndex);
      
      if (!moduleSet.panelEquipmentGroups || moduleSet.panelEquipmentGroups.length === 0) {
        return;
      }
      
      // deletedGroupIndex 是被刪除群組的原始索引
      // 刪除後，索引 >= deletedGroupIndex 的群組現在索引變成了 deletedGroupIndex, deletedGroupIndex+1...
      // 我們需要從 deletedGroupIndex 開始重新計算位置（跳過索引 < deletedGroupIndex 的群組，它們位置不變）
      
      for (let i = deletedGroupIndex; i < moduleSet.panelEquipmentGroups.length; i++) {
        const currentGroup = moduleSet.panelEquipmentGroups[i];
        let baseY;
        const currentTopY = Math.min(currentGroup.panel.position.y, currentGroup.equipment.position.y);
        
        if (i === 0) {
          // 第一個群組（如果第一個也被刪除了，這種情況不應該發生）
          const floorBottomY = moduleSet.floor.position.y + this.getCardHeight('floor');
          baseY = floorBottomY + PANEL_EQUIPMENT_GROUP_SPACING;
        } else {
          // 基於前一個群組（i-1）的最底部位置
          const prevGroup = moduleSet.panelEquipmentGroups[i - 1];
          
          // 計算前一個群組的最底部位置（包括所有額外設備卡片）
          let prevGroupMaxBottomY = Math.max(
            prevGroup.panel.position.y + this.getCardHeight('panel'),
            prevGroup.equipment.position.y + this.getCardHeight('equipment')
          );
          
          if (prevGroup.additionalEquipmentCards && prevGroup.additionalEquipmentCards.length > 0) {
            prevGroup.additionalEquipmentCards.forEach(card => {
              const cardBottomY = card.position.y + this.getCardHeight('equipment');
              prevGroupMaxBottomY = Math.max(prevGroupMaxBottomY, cardBottomY);
            });
          }
          
          baseY = prevGroupMaxBottomY + PANEL_EQUIPMENT_GROUP_SPACING;
        }
        
        // 計算需要移動的距離（向上移動，所以 offsetY 應該是負數或零）
        const offsetY = baseY - currentTopY;
        
        if (Math.abs(offsetY) > 0.1) {
          console.log(`群組 ${i} 需要移動 ${offsetY}px（從 ${currentTopY} 移動到 ${baseY}）`);
          
          // 移動當前群組的 panel 和 equipment
          currentGroup.panel.position.y += offsetY;
          currentGroup.equipment.position.y += offsetY;
          
          // 如果有閥件，也移動閥件
          if (currentGroup.valve) {
            currentGroup.valve.position.y += offsetY;
          }
          
          // 更新額外設備卡片的位置
          if (currentGroup.additionalEquipmentCards && currentGroup.additionalEquipmentCards.length > 0) {
            currentGroup.additionalEquipmentCards.forEach(card => {
              card.position.y += offsetY;
            });
          }
        }
      }
      
      // 確保所有後續群組的連接線都已更新（包括移動和未移動的群組）
      // 從 deletedGroupIndex 開始，更新所有後續群組的連接線位置
      // 這樣可以確保即使某些群組不需要移動，它們的連接線也會基於新的位置重新計算
      for (let i = deletedGroupIndex; i < moduleSet.panelEquipmentGroups.length; i++) {
        this.updatePanelEquipmentGroupConnectionLines(moduleSet, i);
      }
      
      console.log('已完成主分支 Panel+Equipment 群組位置重組');
    },
    
    /**
     * 刪除群組後重新組織被刪除群組之後的分支 Panel+Equipment 群組位置（向上移動）
     * @param {Object} branchModule - 分支模組對象
     * @param {number} deletedGroupIndex - 被刪除群組的原始索引
     */
    reorganizeBranchPanelEquipmentGroupsAfterDelete(branchModule, deletedGroupIndex) {
      console.log('重新組織分支 Panel+Equipment 群組位置，被刪除群組索引:', deletedGroupIndex);
      
      if (!branchModule.panelEquipmentGroups || branchModule.panelEquipmentGroups.length === 0) {
        return;
      }
      
      // 找到這個分支模組所在的模組組和索引
      let moduleSet = null;
      let branchModuleIndex = -1;
      for (let i = 0; i < this.allModuleSets.length; i++) {
        const ms = this.allModuleSets[i];
        if (ms.branchModuleCards && ms.branchModuleCards.length > 0) {
          const index = ms.branchModuleCards.findIndex(bm => bm === branchModule);
          if (index !== -1) {
            moduleSet = ms;
            branchModuleIndex = index;
            break;
          }
        }
      }
      
      // 從 deletedGroupIndex 開始重新計算位置
      for (let i = deletedGroupIndex; i < branchModule.panelEquipmentGroups.length; i++) {
        const currentGroup = branchModule.panelEquipmentGroups[i];
        let baseY;
        const currentTopY = Math.min(currentGroup.panel.position.y, currentGroup.equipment.position.y);
        
        if (i === 0) {
          // 第一個群組：基於 floor 位置
          const floorBottomY = branchModule.floor.position.y + this.getCardHeight('floor');
          baseY = floorBottomY + PANEL_EQUIPMENT_GROUP_SPACING;
        } else {
          // 後續群組：基於前一個群組的最底部位置
          const prevGroup = branchModule.panelEquipmentGroups[i - 1];
          
          // 計算前一個群組的最底部位置（包括所有額外設備卡片）
          let prevGroupMaxBottomY = Math.max(
            prevGroup.panel.position.y + this.getCardHeight('panel'),
            prevGroup.equipment.position.y + this.getCardHeight('equipment')
          );
          
          if (prevGroup.additionalEquipmentCards && prevGroup.additionalEquipmentCards.length > 0) {
            prevGroup.additionalEquipmentCards.forEach(card => {
              const cardBottomY = card.position.y + this.getCardHeight('equipment');
              prevGroupMaxBottomY = Math.max(prevGroupMaxBottomY, cardBottomY);
            });
          }
          
          baseY = prevGroupMaxBottomY + PANEL_EQUIPMENT_GROUP_SPACING;
        }
        
        // 計算需要移動的距離
        const offsetY = baseY - currentTopY;
        
        if (Math.abs(offsetY) > 0.1) {
          console.log(`分支群組 ${i} 需要移動 ${offsetY}px（從 ${currentTopY} 移動到 ${baseY}）`);
          
          // 移動當前群組的 panel 和 equipment
          currentGroup.panel.position.y += offsetY;
          currentGroup.equipment.position.y += offsetY;
          
          // 更新額外設備卡片的位置
          if (currentGroup.additionalEquipmentCards && currentGroup.additionalEquipmentCards.length > 0) {
            currentGroup.additionalEquipmentCards.forEach(card => {
              card.position.y += offsetY;
            });
          }
          
          // 更新該群組相關的連接線位置
          if (moduleSet && branchModuleIndex !== -1) {
            this.updateBranchPanelEquipmentGroupConnectionLines(moduleSet, branchModuleIndex, i);
          }
        }
      }
      
      console.log('已完成分支 Panel+Equipment 群組位置重組');
    },
    
    /**
     * 更新特定分支 Panel+Equipment 群組的連接線位置
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     */
    updateBranchPanelEquipmentGroupConnectionLines(moduleSet, branchModuleIndex, groupIndex) {
      const branchModule = moduleSet.branchModuleCards[branchModuleIndex];
      if (!branchModule || !branchModule.panelEquipmentGroups || !branchModule.panelEquipmentGroups[groupIndex]) {
        return;
      }
      
      const group = branchModule.panelEquipmentGroups[groupIndex];
      
      // 更新分支 floor 到 panel 的連接線位置
      moduleSet.connections.forEach(conn => {
        if (conn.from === 'branch-floor' && conn.to === 'branch-panel' && 
            conn.branchModuleIndex === branchModuleIndex && 
            conn.panelEquipmentGroupIndex === groupIndex) {
          // 計算原始 floor → panel 連接線上 add icon 的位置
          const firstPanel = branchModule.panelEquipmentGroups[0].panel;
          const floorRight = branchModule.floor.position.x + CARD_WIDTH;
          const floorY = branchModule.floor.position.y + CARD_HEIGHT_OFFSET;
          const firstPanelLeft = firstPanel.position.x;
          
          // 計算 add icon 的位置
          const midX = floorRight + (firstPanelLeft - floorRight) * 0.9;
          const iconX = floorRight + (midX - floorRight) * 0.33;
          const iconY = floorY;
          const newConnectionStartX = iconX + 39; // 圖標中心在 iconX，右邊在 iconX + 16
          
          conn.fromPosition = { x: newConnectionStartX, y: iconY };
        }
        
        // 更新該群組的額外設備卡片連接線位置
        if (conn.from === 'branch-panel-equipment-connection' && 
            conn.branchModuleIndex === branchModuleIndex && 
            conn.panelEquipmentGroupIndex === groupIndex && 
            conn.equipmentCardIndex !== undefined) {
          const card = group.additionalEquipmentCards?.[conn.equipmentCardIndex];
          if (card) {
            // 重新計算連接線起始位置
            const panelRightX = group.panel.position.x + CARD_WIDTH;
            const panelY = group.panel.position.y + CARD_HEIGHT_OFFSET;
            const equipmentLeftX = group.equipment.position.x;
            
            const midX = panelRightX + (equipmentLeftX - panelRightX) * 0.9;
            const iconX = panelRightX + (midX - panelRightX) * 0.33;
            const purpleIconX = panelRightX + (equipmentLeftX - panelRightX) * 0.67;
            const connectionStartX = (iconX + purpleIconX) / 2;
            
            conn.fromPosition = { x: connectionStartX, y: panelY };
            conn.toPosition = { x: card.position.x, y: card.position.y + CARD_HEIGHT_OFFSET };
          }
        }
      });
    },
    
    /**
     * 刪除 Panel+Equipment 群組的連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - 群組索引
     */
    removePanelEquipmentGroupConnections(moduleSet, groupIndex) {
      // 刪除該群組的所有連接線
      moduleSet.connections = moduleSet.connections.filter(conn => {
        // 刪除從 additional-icon 到該群組 panel 的連接線
        if (conn.from === 'additional-icon' && conn.to === 'panel' && conn.groupIndex === groupIndex) {
          return false;
        }
        // 刪除 panel 到 equipment 的連接線
        if (conn.from === 'panel' && conn.to === 'equipment' && conn.groupIndex === groupIndex) {
          return false;
        }
        // 刪除該群組的額外設備卡片連接線
        if (conn.from === 'panel-equipment-connection' && conn.groupIndex === groupIndex) {
          return false;
        }
        if (conn.from === 'panel-equipment-valve' && conn.groupIndex === groupIndex) {
          return false;
        }
        return true;
      });
      
      // 更新後續群組的索引
      moduleSet.connections.forEach(conn => {
        if (conn.groupIndex !== undefined && conn.groupIndex > groupIndex) {
          conn.groupIndex = conn.groupIndex - 1;
        }
      });
    },
    
    /**
     * 刪除額外設備卡片的連接線（主面板）
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - 群組索引
     * @param {number} cardIndex - 卡片索引
     */
    removeAdditionalEquipmentCardConnection(moduleSet, groupIndex, cardIndex) {
      moduleSet.connections = moduleSet.connections.filter(conn => {
        if ((conn.from === 'panel-equipment-connection' || conn.from === 'panel-equipment-valve') && 
            conn.groupIndex === groupIndex && 
            conn.equipmentCardIndex === cardIndex) {
          return false;
        }
        return true;
      });
    },
    
    /**
     * 刪除設備卡片後重新組織被刪除卡片之後的主分支設備卡片位置（向上移動）
     * @param {Object} moduleSet - 模組組對象
     * @param {Object} currentGroup - 當前群組對象
     * @param {number} groupIndex - 群組索引
     * @param {number} deletedCardIndex - 被刪除卡片的原始索引
     */
    reorganizeAdditionalEquipmentCardsAfterDelete(moduleSet, currentGroup, groupIndex, deletedCardIndex) {
      console.log('重新組織主分支設備卡片位置，被刪除卡片索引:', deletedCardIndex);
      
      if (!currentGroup || !currentGroup.additionalEquipmentCards || 
          currentGroup.additionalEquipmentCards.length === 0) {
        return;
      }
      
      const equipmentCardHeight = this.getCardHeight('equipment');
      const spacing = 50; // 設備卡片之間的間距
      
      // 從 deletedCardIndex 開始重新計算位置（刪除後，索引 >= deletedCardIndex 的卡片現在索引變成了 deletedCardIndex, deletedCardIndex+1...）
      for (let i = deletedCardIndex; i < currentGroup.additionalEquipmentCards.length; i++) {
        const currentCard = currentGroup.additionalEquipmentCards[i];
        let baseY;
        
        if (i === 0) {
          // 第一個設備卡片：基於 equipment 或 valve 位置
          if (currentGroup.valve) {
            baseY = currentGroup.valve.position.y + equipmentCardHeight + spacing;
          } else {
            baseY = currentGroup.equipment.position.y + equipmentCardHeight + spacing;
          }
        } else {
          // 後續設備卡片：基於前一個設備卡片的位置
          const prevCard = currentGroup.additionalEquipmentCards[i - 1];
          baseY = prevCard.position.y + equipmentCardHeight + spacing;
        }
        
        // 計算需要移動的距離
        const offsetY = baseY - currentCard.position.y;
        
        if (Math.abs(offsetY) > 0.1) {
          console.log(`設備卡片 ${i} 需要移動 ${offsetY}px（從 ${currentCard.position.y} 移動到 ${baseY}）`);
          
          // 移動當前卡片
          currentCard.position.y += offsetY;
          
          // 更新該卡片相關的連接線位置
          this.updateAdditionalEquipmentCardConnectionLine(moduleSet, groupIndex, i, currentCard);
        }
      }
      
      console.log('已完成主分支設備卡片位置重組');
    },
    
    /**
     * 刪除設備卡片後重新組織被刪除卡片之後的分支設備卡片位置（向上移動）
     * @param {Object} moduleSet - 模組組對象
     * @param {Object} currentGroup - 當前群組對象
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     * @param {number} deletedCardIndex - 被刪除卡片的原始索引
     */
    reorganizeBranchAdditionalEquipmentCardsAfterDelete(moduleSet, currentGroup, branchModuleIndex, groupIndex, deletedCardIndex) {
      console.log('重新組織分支設備卡片位置，被刪除卡片索引:', deletedCardIndex);
      
      if (!currentGroup || !currentGroup.additionalEquipmentCards || 
          currentGroup.additionalEquipmentCards.length === 0) {
        return;
      }
      
      const equipmentCardHeight = this.getCardHeight('equipment');
      const spacing = 50; // 設備卡片之間的間距
      
      // 從 deletedCardIndex 開始重新計算位置
      for (let i = deletedCardIndex; i < currentGroup.additionalEquipmentCards.length; i++) {
        const currentCard = currentGroup.additionalEquipmentCards[i];
        let baseY;
        
        if (i === 0) {
          // 第一個設備卡片：基於 equipment 位置
          baseY = currentGroup.equipment.position.y + equipmentCardHeight + spacing;
        } else {
          // 後續設備卡片：基於前一個設備卡片的位置
          const prevCard = currentGroup.additionalEquipmentCards[i - 1];
          baseY = prevCard.position.y + equipmentCardHeight + spacing;
        }
        
        // 計算需要移動的距離
        const offsetY = baseY - currentCard.position.y;
        
        if (Math.abs(offsetY) > 0.1) {
          console.log(`分支設備卡片 ${i} 需要移動 ${offsetY}px（從 ${currentCard.position.y} 移動到 ${baseY}）`);
          
          // 移動當前卡片
          currentCard.position.y += offsetY;
          
          // 更新該卡片相關的連接線位置
          this.updateBranchAdditionalEquipmentCardConnectionLine(moduleSet, branchModuleIndex, groupIndex, i, currentCard);
        }
      }
      
      console.log('已完成分支設備卡片位置重組');
    },
    
    /**
     * 更新單個設備卡片的連接線位置（主分支）
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - 群組索引
     * @param {number} cardIndex - 卡片索引
     * @param {Object} card - 卡片對象
     */
    updateAdditionalEquipmentCardConnectionLine(moduleSet, groupIndex, cardIndex, card) {
      moduleSet.connections.forEach(conn => {
        if ((conn.from === 'panel-equipment-connection' || conn.from === 'panel-equipment-valve') && 
            conn.groupIndex === groupIndex && 
            conn.equipmentCardIndex === cardIndex) {
          conn.toPosition = {
            x: card.position.x,
            y: card.position.y + CARD_HEIGHT_OFFSET
          };
        }
      });
    },
    
    /**
     * 更新單個設備卡片的連接線位置（分支）
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     * @param {number} cardIndex - 卡片索引
     * @param {Object} card - 卡片對象
     */
    updateBranchAdditionalEquipmentCardConnectionLine(moduleSet, branchModuleIndex, groupIndex, cardIndex, card) {
      moduleSet.connections.forEach(conn => {
        if (conn.from === 'branch-panel-equipment-connection' && 
            conn.branchModuleIndex === branchModuleIndex && 
            conn.panelEquipmentGroupIndex === groupIndex && 
            conn.equipmentCardIndex === cardIndex) {
          conn.toPosition = {
            x: card.position.x,
            y: card.position.y + CARD_HEIGHT_OFFSET
          };
        }
      });
    },
    
    /**
     * 更新額外設備卡片連接線的索引（主面板）
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - 群組索引
     * @param {number} deletedCardIndex - 被刪除的卡片索引
     */
    updateAdditionalEquipmentCardIndices(moduleSet, groupIndex, deletedCardIndex) {
      moduleSet.connections.forEach(conn => {
        if ((conn.from === 'panel-equipment-connection' || conn.from === 'panel-equipment-valve') && 
            conn.groupIndex === groupIndex && 
            conn.equipmentCardIndex !== undefined && 
            conn.equipmentCardIndex > deletedCardIndex) {
          conn.equipmentCardIndex = conn.equipmentCardIndex - 1;
        }
      });
    },
    
    /**
     * 刪除分支 Panel+Equipment 群組的連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     */
    removeBranchPanelEquipmentGroupConnections(moduleSet, branchModuleIndex, groupIndex) {
      // 刪除該群組的所有連接線
      moduleSet.connections = moduleSet.connections.filter(conn => {
        // 刪除分支 panel 到 equipment 的連接線
        if (conn.from === 'branch-panel' && conn.to === 'branch-equipment' && 
            conn.branchModuleIndex === branchModuleIndex && 
            conn.panelEquipmentGroupIndex === groupIndex) {
          return false;
        }
        // 刪除分支 floor 到 panel 的連接線
        if (conn.from === 'branch-floor' && conn.to === 'branch-panel' && 
            conn.branchModuleIndex === branchModuleIndex && 
            conn.panelEquipmentGroupIndex === groupIndex) {
          return false;
        }
        // 刪除該群組的額外設備卡片連接線
        if (conn.from === 'branch-panel-equipment-connection' && 
            conn.branchModuleIndex === branchModuleIndex && 
            conn.panelEquipmentGroupIndex === groupIndex) {
          return false;
        }
        return true;
      });
      
      // 更新後續群組的索引
      moduleSet.connections.forEach(conn => {
        if (conn.panelEquipmentGroupIndex !== undefined && 
            conn.branchModuleIndex === branchModuleIndex && 
            conn.panelEquipmentGroupIndex > groupIndex) {
          conn.panelEquipmentGroupIndex = conn.panelEquipmentGroupIndex - 1;
        }
      });
    },
    
    /**
     * 刪除分支額外設備卡片的連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     * @param {number} cardIndex - 卡片索引
     */
    removeBranchAdditionalEquipmentCardConnection(moduleSet, branchModuleIndex, groupIndex, cardIndex) {
      moduleSet.connections = moduleSet.connections.filter(conn => {
        if (conn.from === 'branch-panel-equipment-connection' && 
            conn.branchModuleIndex === branchModuleIndex && 
            conn.panelEquipmentGroupIndex === groupIndex && 
            conn.equipmentCardIndex === cardIndex) {
          return false;
        }
        return true;
      });
    },
    
    /**
     * 更新分支額外設備卡片連接線的索引
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     * @param {number} deletedCardIndex - 被刪除的卡片索引
     */
    updateBranchAdditionalEquipmentCardIndices(moduleSet, branchModuleIndex, groupIndex, deletedCardIndex) {
      moduleSet.connections.forEach(conn => {
        if (conn.from === 'branch-panel-equipment-connection' && 
            conn.branchModuleIndex === branchModuleIndex && 
            conn.panelEquipmentGroupIndex === groupIndex && 
            conn.equipmentCardIndex !== undefined && 
            conn.equipmentCardIndex > deletedCardIndex) {
          conn.equipmentCardIndex = conn.equipmentCardIndex - 1;
        }
      });
    },
    
    // ==================== 閥件管理 ====================
    /**
     * 添加閥件資訊卡片
     * @param {Object} connection - 連接對象
     * @param {number} moduleSetIndex - 模組組索引
     */
    addValveInfoCard(connection, moduleSetIndex = 0) {
      console.log(`添加閥件資訊卡片到模組組 ${moduleSetIndex}`);
      
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      
      if (!currentModuleSet) {
        console.error('找不到當前的模組組');
        return;
      }
      
      const newValveCard = this.createValveCard(currentModuleSet);
      
      // 初始化閥件卡片數組
      if (!currentModuleSet.valveCards) {
        currentModuleSet.valveCards = [];
      }
      currentModuleSet.valveCards.push(newValveCard);
      
      // 將管線資訊及後續卡片往右推移
      this.shiftCardsRight(currentModuleSet, currentModuleSet.pipeline.position.x);
      
      // 更新連接線配置
      this.updateConnectionsForValve(currentModuleSet);
      
      // 更新已存在的 Panel+Equipment 群組的連接線起始點
      this.updateExistingPanelConnections(currentModuleSet);
      
      // 更新設備卡片的連接線位置
      this.updateAdditionalEquipmentConnectionLines(currentModuleSet, -1);
      
      // 更新所有模組組的位置（因為該模組組高度可能改變）
      this.updateAllModuleSetPositions();
      
      console.log(`已在模組組 ${moduleSetIndex} 中添加閥件資訊卡片:`, newValveCard);
    },
    
    /**
     * 在 panel 和 equipment 之間添加閥件
     * @param {Object} connection - 連接對象
     * @param {number} moduleSetIndex - 模組組索引
     */
    addValveBetweenPanelAndEquipment(connection, moduleSetIndex = 0) {
      console.log(`在 panel 和 equipment 之間添加閥件到模組組 ${moduleSetIndex}`);
      
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      
      if (!currentModuleSet) {
        console.error('找不到當前的模組組');
        return;
      }

      const { connIndex } = this.parseConnectionId(connection.id);
      const connConfig = currentModuleSet.connections[connIndex];
      const groupIndex = connConfig.groupIndex || 0;
      
      const panelEquipmentGroup = currentModuleSet.panelEquipmentGroups[groupIndex];
      if (!panelEquipmentGroup) {
        console.error('找不到對應的 Panel+Equipment 群組');
        return;
      }

      const panel = panelEquipmentGroup.panel;
      const equipment = panelEquipmentGroup.equipment;

      // 檢查是否已經有面板設備閥件
      if (!panelEquipmentGroup.valve) {
        // 閥件取代第一個設備資訊的位置
        const valveX = equipment.position.x;
        const valveY = equipment.position.y;

        // 創建新的面板設備閥件
        const valve = {
          id: `panel-equipment-valve-${Date.now()}`,
          type: 'panel-equipment-valve',
          position: { x: valveX, y: valveY },
          data: {
            connectorType: '',
            size: '',
            valveType: '',
            enableValve: false,
            branchSize: '',
            backPipelineType: '單套管'
          }
        };
        
        // 將閥件添加到群組中
        panelEquipmentGroup.valve = valve;

        // 將 equipment 向右推移（閥件寬度232 + 間距86 = 318px）
        const shiftDistance = 318;
        equipment.position.x = equipment.position.x + shiftDistance;

        // 如果有額外的設備卡片，也向右推移
        if (panelEquipmentGroup.additionalEquipmentCards) {
          panelEquipmentGroup.additionalEquipmentCards.forEach(card => {
            card.position.x += shiftDistance;
          });
        }

        // 更新連接線配置
        this.updateConnectionsForPanelEquipmentValve(currentModuleSet, groupIndex);

        // 更新額外設備卡片的連接線位置
        this.updatePanelEquipmentAdditionalConnectionLines(currentModuleSet, groupIndex);
        
        // 更新所有模組組的位置（因為該模組組高度可能改變）
        this.updateAllModuleSetPositions();

        console.log(`已在模組組 ${moduleSetIndex} 的 Panel-Equipment 群組 ${groupIndex} 之間添加閥件:`, valve);
      }
    },
    
    /**
     * 在 panel 和額外設備卡片之間添加閥件
     * @param {Object} connection - 連接對象
     * @param {number} moduleSetIndex - 模組組索引
     */
    addValveBetweenPanelAndAdditionalEquipment(connection, moduleSetIndex = 0) {
      console.log(`在 panel 和額外設備卡片之間添加閥件到模組組 ${moduleSetIndex}`);
      
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      
      if (!currentModuleSet) {
        console.error('找不到當前的模組組');
        return;
      }

      const { connIndex } = this.parseConnectionId(connection.id);
      const connConfig = currentModuleSet.connections[connIndex];
      const groupIndex = connConfig.groupIndex !== undefined ? connConfig.groupIndex : 0;
      const equipmentCardIndex = connConfig.equipmentCardIndex;
      
      const panelEquipmentGroup = currentModuleSet.panelEquipmentGroups[groupIndex];
      if (!panelEquipmentGroup) {
        console.error('找不到對應的 Panel+Equipment 群組');
        return;
      }
      
      if (equipmentCardIndex === undefined || !panelEquipmentGroup.additionalEquipmentCards || 
          equipmentCardIndex >= panelEquipmentGroup.additionalEquipmentCards.length) {
        console.error('找不到對應的額外設備卡片');
        return;
      }

      const equipmentCard = panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex];
      
      // 檢查該設備卡片是否已經有閥件
      if (equipmentCard.valve) {
        console.log('該設備卡片已經有閥件');
        return;
      }

      const panel = panelEquipmentGroup.panel;
      
      // 閥件位置：在設備卡片的位置上
      const valveX = equipmentCard.position.x;
      const valveY = equipmentCard.position.y;

      // 創建新的閥件
      const valve = {
        id: `additional-equipment-valve-${Date.now()}`,
        type: 'additional-equipment-valve',
        position: { x: valveX, y: valveY },
        data: {
          connectorType: '',
          size: '',
          valveType: '',
          enableValve: false,
          branchSize: '',
          backPipelineType: '單套管'
        }
      };
      
      // 將閥件添加到設備卡片對象中
      equipmentCard.valve = valve;

      // 將設備卡片向右推移（閥件寬度232 + 間距86 = 318px）
      const shiftDistance = 318;
      equipmentCard.position.x = equipmentCard.position.x + shiftDistance;

      // 如果有該設備卡片之後的其他設備卡片，也向右推移
      if (panelEquipmentGroup.additionalEquipmentCards) {
        for (let i = equipmentCardIndex + 1; i < panelEquipmentGroup.additionalEquipmentCards.length; i++) {
          panelEquipmentGroup.additionalEquipmentCards[i].position.x += shiftDistance;
        }
      }

      // 更新連接線配置
      this.updateConnectionsForAdditionalEquipmentValve(currentModuleSet, groupIndex, equipmentCardIndex);

      // 更新其他額外設備卡片的連接線位置（只更新主分支）
      this.updateOtherAdditionalEquipmentConnectionLines(currentModuleSet, groupIndex, equipmentCardIndex);
      
      // 只更新主分支的設備卡片連接線，不更新所有模組組位置（避免影響分支設備卡片）
      this.updateAdditionalEquipmentConnectionLines(currentModuleSet, -1);
      
      // 當主分支添加閥件後，更新所有分支的設備卡片和閥件位置（確保對齊）
      if (currentModuleSet.branchModuleCards && currentModuleSet.branchModuleCards.length > 0) {
        this.updateAllBranchValvePositions(currentModuleSet);
        // 更新所有分支的設備卡片連接線
        currentModuleSet.branchModuleCards.forEach((_, branchIndex) => {
          this.updateAdditionalEquipmentConnectionLines(currentModuleSet, branchIndex);
        });
      }

      console.log(`已在模組組 ${moduleSetIndex} 的 Panel-Equipment 群組 ${groupIndex} 的設備卡片 ${equipmentCardIndex} 之前添加閥件:`, valve);
    },
    
    /**
     * 在分支 panel 和分支額外設備卡片之間添加閥件
     * @param {Object} connection - 連接對象
     * @param {number} moduleSetIndex - 模組組索引
     */
    addValveBetweenBranchPanelAndAdditionalEquipment(connection, moduleSetIndex = 0) {
      console.log(`在分支 panel 和分支額外設備卡片之間添加閥件到模組組 ${moduleSetIndex}`);
      
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      
      if (!currentModuleSet) {
        console.error('找不到當前的模組組');
        return;
      }

      const { connIndex } = this.parseConnectionId(connection.id);
      const connConfig = currentModuleSet.connections[connIndex];
      const branchModuleIndex = connConfig.branchModuleIndex;
      const groupIndex = connConfig.panelEquipmentGroupIndex !== undefined ? connConfig.panelEquipmentGroupIndex : 0;
      const equipmentCardIndex = connConfig.equipmentCardIndex;
      
      if (branchModuleIndex === undefined || !currentModuleSet.branchModuleCards || 
          branchModuleIndex >= currentModuleSet.branchModuleCards.length) {
        console.error('找不到對應的分支模組');
        return;
      }
      
      const branchModule = currentModuleSet.branchModuleCards[branchModuleIndex];
      const panelEquipmentGroup = branchModule.panelEquipmentGroups[groupIndex];
      
      if (!panelEquipmentGroup) {
        console.error('找不到對應的分支 Panel+Equipment 群組');
        return;
      }
      
      if (equipmentCardIndex === undefined || !panelEquipmentGroup.additionalEquipmentCards || 
          equipmentCardIndex >= panelEquipmentGroup.additionalEquipmentCards.length) {
        console.error('找不到對應的分支額外設備卡片');
        return;
      }

      const equipmentCard = panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex];
      
      // 檢查該設備卡片是否已經有閥件
      if (equipmentCard.valve) {
        console.log('該分支設備卡片已經有閥件');
        return;
      }
      
      // 獲取主分支對應位置的設備卡片位置，確保對齊
      const mainGroup = currentModuleSet.panelEquipmentGroups[groupIndex];
      
      // 計算閥件應該在哪個位置（對齊主設備閥件或 equipment）
      let targetValveX;
      let targetValveY;
      let targetEquipmentY;
      if (mainGroup && mainGroup.additionalEquipmentCards && 
          equipmentCardIndex < mainGroup.additionalEquipmentCards.length) {
        // 主分支對應位置的設備卡片
        const mainEquipmentCard = mainGroup.additionalEquipmentCards[equipmentCardIndex];
        
        // 如果主設備卡片有閥件，閥件位置（X和Y）就是主設備閥件的位置
        // 如果主設備卡片沒有閥件，閥件應該在 equipment.position.x
        if (mainEquipmentCard.valve) {
          targetValveX = mainEquipmentCard.valve.position.x;
          targetValveY = mainEquipmentCard.valve.position.y; // 閥件對閥件：Y軸對齊
        } else {
          targetValveX = panelEquipmentGroup.equipment.position.x;
          targetValveY = mainEquipmentCard.position.y; // 如果主分支沒有閥件，閥件Y與設備卡片對齊
        }
        // 設備對設備：Y軸對齊
        targetEquipmentY = mainEquipmentCard.position.y;
      } else if (mainGroup && mainGroup.additionalEquipmentCards && mainGroup.additionalEquipmentCards.length > 0) {
        // 主分支有設備卡片但沒有對應索引的卡片，使用主分支最後一個設備卡片的位置模式
        const lastMainCard = mainGroup.additionalEquipmentCards[mainGroup.additionalEquipmentCards.length - 1];
        const equipmentCardHeight = this.getCardHeight('equipment');
        const spacing = 50;
        // 計算應該對齊的位置：基於主分支最後一個卡片的位置 + 間距
        const offsetFromMainLast = equipmentCardIndex - (mainGroup.additionalEquipmentCards.length - 1);
        targetEquipmentY = lastMainCard.position.y + (offsetFromMainLast * (equipmentCardHeight + spacing));
        
        // 閥件位置：如果主分支最後一個卡片有閥件，對齊閥件；否則對齊equipment位置
        if (lastMainCard.valve) {
          targetValveX = lastMainCard.valve.position.x;
          targetValveY = lastMainCard.valve.position.y + (offsetFromMainLast * (equipmentCardHeight + spacing));
        } else {
          targetValveX = panelEquipmentGroup.equipment.position.x;
          targetValveY = targetEquipmentY; // 閥件Y與設備對齊
        }
      } else {
        // 如果主分支沒有對應位置的設備卡片，使用分支 equipment 位置
        targetValveX = panelEquipmentGroup.equipment.position.x;
        targetValveY = equipmentCard.position.y; // 保持原位置
        targetEquipmentY = equipmentCard.position.y; // 保持原位置
      }
      
      // 閥件位置：應該對齊到主分支閥件位置（如果存在）或 equipment 位置
      const valveX = targetValveX;
      const valveY = targetValveY; // 使用對齊後的Y位置

      // 創建新的閥件
      const valve = {
        id: `branch-additional-equipment-valve-${Date.now()}`,
        type: 'branch-additional-equipment-valve',
        position: { x: valveX, y: valveY },
        data: {
          connectorType: '',
          size: '',
          valveType: '',
          enableValve: false,
          branchSize: '',
          backPipelineType: '單套管'
        }
      };
      
      // 將閥件添加到設備卡片對象中
      equipmentCard.valve = valve;

      // 計算設備卡片應該在哪個位置（對齊主設備卡片）
      const shiftDistance = 318;
      let targetCardX;
      if (mainGroup && mainGroup.additionalEquipmentCards && 
          equipmentCardIndex < mainGroup.additionalEquipmentCards.length) {
        // 主分支對應位置的設備卡片位置（已經有閥件偏移的話，已經在 equipment.position.x + 318）
        const mainEquipmentCard = mainGroup.additionalEquipmentCards[equipmentCardIndex];
        targetCardX = mainEquipmentCard.position.x;
      } else if (mainGroup && mainGroup.additionalEquipmentCards && mainGroup.additionalEquipmentCards.length > 0) {
        // 主分支有設備卡片但沒有對應索引的卡片，使用主分支最後一個設備卡片的X位置
        const lastMainCard = mainGroup.additionalEquipmentCards[mainGroup.additionalEquipmentCards.length - 1];
        targetCardX = lastMainCard.position.x;
      } else {
        // 如果主分支沒有對應位置的設備卡片，使用閥件位置 + 偏移
        targetCardX = valveX + shiftDistance;
      }
      
      // 直接對齊到目標位置（X和Y都對齊）
      equipmentCard.position.x = targetCardX;
      equipmentCard.position.y = targetEquipmentY; // 設備對設備：Y軸對齊

      // 如果有該設備卡片之後的其他設備卡片（同一分支），也需要對齊主分支
      if (panelEquipmentGroup.additionalEquipmentCards) {
        for (let i = equipmentCardIndex + 1; i < panelEquipmentGroup.additionalEquipmentCards.length; i++) {
          // 檢查主分支對應位置的設備卡片位置，確保對齊（閥件對閥件、設備對設備）
          const nextCard = panelEquipmentGroup.additionalEquipmentCards[i];
          let nextTargetX;
          let nextTargetY;
          if (mainGroup && mainGroup.additionalEquipmentCards && 
              i < mainGroup.additionalEquipmentCards.length) {
            // 主分支有對應位置的設備卡片，直接使用其位置對齊（X和Y都對齊）
            const mainNextCard = mainGroup.additionalEquipmentCards[i];
            nextTargetX = mainNextCard.position.x;
            nextTargetY = mainNextCard.position.y; // 設備對設備：Y軸對齊
            
            // 如果該設備卡片有閥件，也需要對齊主分支對應位置的閥件（X和Y軸都對齊）
            if (nextCard.valve && mainNextCard.valve) {
              nextCard.valve.position.x = mainNextCard.valve.position.x; // 閥件對閥件：X軸對齊
              nextCard.valve.position.y = mainNextCard.valve.position.y; // 閥件對閥件：Y軸對齊
            } else if (nextCard.valve && !mainNextCard.valve) {
              // 如果分支有閥件但主分支沒有，閥件X位置應該對齊主分支equipment位置
              nextCard.valve.position.x = mainGroup.equipment.position.x;
              nextCard.valve.position.y = mainNextCard.position.y; // Y軸與設備對齊
            }
          } else {
            // 如果主分支沒有對應位置，則基於前一個卡片位置（已經對齊過）
            const prevCard = panelEquipmentGroup.additionalEquipmentCards[i - 1];
            // 前一個卡片已經對齊到主分支，如果前一個卡片有閥件，下一個卡片應該在前一個卡片位置
            // 如果前一個卡片沒有閥件，下一個卡片也應該在前一個卡片位置（因為沒有閥件偏移）
            nextTargetX = prevCard.position.x;
            // Y軸：如果有前一個卡片，使用前一個卡片的位置計算（保持間距）
            const equipmentCardHeight = this.getCardHeight('equipment');
            nextTargetY = prevCard.position.y + equipmentCardHeight + 50;
          }
          // 直接對齊到目標位置（X和Y都對齊）
          nextCard.position.x = nextTargetX;
          nextCard.position.y = nextTargetY; // 設備對設備：Y軸對齊
        }
      }

      // 更新連接線配置
      this.updateConnectionsForBranchAdditionalEquipmentValve(currentModuleSet, branchModuleIndex, groupIndex, equipmentCardIndex);

      // 更新其他分支額外設備卡片的連接線位置（只更新該分支）
      this.updateOtherBranchAdditionalEquipmentConnectionLines(currentModuleSet, branchModuleIndex, groupIndex, equipmentCardIndex);
      
      // 當分支添加閥件後，更新所有分支的位置（確保所有分支都與主分支對齊）
      if (currentModuleSet.branchModuleCards && currentModuleSet.branchModuleCards.length > 0) {
        this.updateAllBranchValvePositions(currentModuleSet);
        // 更新所有分支的設備卡片連接線
        currentModuleSet.branchModuleCards.forEach((_, index) => {
          this.updateAdditionalEquipmentConnectionLines(currentModuleSet, index);
        });
      }
      
      // 更新主分支的設備卡片連接線
      this.updateAdditionalEquipmentConnectionLines(currentModuleSet, -1);

      console.log(`已在模組組 ${moduleSetIndex} 的分支 ${branchModuleIndex} Panel-Equipment 群組 ${groupIndex} 的設備卡片 ${equipmentCardIndex} 之前添加閥件:`, valve);
    },
    
    /**
     * 更新連接線配置以適應分支 panel 和分支額外設備卡片之間的閥件
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - Panel+Equipment 群組索引
     * @param {number} equipmentCardIndex - 設備卡片索引
     */
    updateConnectionsForBranchAdditionalEquipmentValve(moduleSet, branchModuleIndex, groupIndex, equipmentCardIndex) {
      // 查找對應的分支額外設備卡片連接線
      const connectionIndex = moduleSet.connections.findIndex(conn => 
        conn.from === 'branch-panel-equipment-connection' &&
        conn.to === 'branch-additional-equipment' &&
        conn.branchModuleIndex === branchModuleIndex &&
        conn.panelEquipmentGroupIndex === groupIndex &&
        conn.equipmentCardIndex === equipmentCardIndex
      );

      if (connectionIndex !== -1) {
        // 插入新的連接線：panel → valve → equipment
        const oldConnection = moduleSet.connections[connectionIndex];
        
        // 獲取 valve 和 equipment 的位置
        const branchModule = moduleSet.branchModuleCards[branchModuleIndex];
        const panelEquipmentGroup = branchModule.panelEquipmentGroups[groupIndex];
        const equipmentCard = panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex];
        const valve = equipmentCard.valve;
        
        moduleSet.connections.splice(connectionIndex, 1);

        // 連接線起點應該在 panel 和主設備分支的 equipment 之間
        // 位置與盤面到未建閥件的主設備卡片起點一樣
        // 必須使用主設備的 panel 位置和主設備的 equipment 位置來計算，才能與主設備的連接線起點一致
        const mainGroup = currentModuleSet.panelEquipmentGroups[groupIndex];
        
        if (!mainGroup) {
          console.error('找不到主設備群組');
          return;
        }
        
        // 使用主設備的 panel 位置（與主設備的連接線起點計算保持一致）
        const mainPanelRightX = mainGroup.panel.position.x + CARD_WIDTH;
        const mainPanelY = mainGroup.panel.position.y + CARD_HEIGHT_OFFSET;
        
        // 使用主設備分支的 equipment 位置（這是未建閥件時的位置，equipment 本身位置不會因為閥件改變）
        const mainEquipmentLeftX = mainGroup.equipment.position.x;
        
        // 計算 add icon 的位置（主設備 panel 和主設備 equipment 之間）
        const midX = mainPanelRightX + (mainEquipmentLeftX - mainPanelRightX) * 0.9;
        const iconX = mainPanelRightX + (midX - mainPanelRightX) * 0.33;
        
        // 計算紫色圖標的位置（在主設備 panel 和主設備 equipment 之間，67% 的位置）
        // 這與 panel 到未建閥件的主設備卡片起點計算方式完全相同
        const purpleIconX = mainPanelRightX + (mainEquipmentLeftX - mainPanelRightX) * 0.67;
        
        // 連接線從 add icon 和 purple icon 之間的位置開始（選擇兩者中間）
        // 注意：Y座標使用分支的 panel Y位置，因為連接線要連接到分支的閥件
        const connectionStartX = (iconX + purpleIconX) / 2;
        const connectionStartY = panelEquipmentGroup.panel.position.y + CARD_HEIGHT_OFFSET;

        // 添加 panel → valve 連接（保留紫色 icon，但不顯示 add icon）
        moduleSet.connections.push({
          from: 'branch-panel-equipment-connection',
          to: 'branch-additional-equipment-valve',
          branchModuleIndex: branchModuleIndex,
          panelEquipmentGroupIndex: groupIndex,
          equipmentCardIndex: equipmentCardIndex,
          showAdditionalIcon: false,
          showFaIcon: true,
          fromPosition: { x: connectionStartX, y: connectionStartY }, // 使用原始連接線的起點位置
          toPosition: { 
            x: valve.position.x, 
            y: valve.position.y + CARD_HEIGHT_OFFSET 
          } // 設置閥件位置的終點
        });

        // 添加 valve → equipment 連接（不顯示 icon）
        moduleSet.connections.push({
          from: 'branch-additional-equipment-valve',
          to: 'branch-additional-equipment',
          branchModuleIndex: branchModuleIndex,
          panelEquipmentGroupIndex: groupIndex,
          equipmentCardIndex: equipmentCardIndex,
          showAdditionalIcon: false,
          showFaIcon: false,
          fromPosition: {
            x: valve.position.x + CARD_WIDTH,
            y: valve.position.y + CARD_HEIGHT_OFFSET
          },
          toPosition: {
            x: equipmentCard.position.x,
            y: equipmentCard.position.y + CARD_HEIGHT_OFFSET
          }
        });
      }
    },
    
    /**
     * 更新其他分支額外設備卡片的連接線位置（當某個設備卡片添加閥件後，後續設備卡片右移，需要更新它們的連接線）
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - Panel+Equipment 群組索引
     * @param {number} shiftedCardIndex - 被推移的設備卡片索引
     */
    updateOtherBranchAdditionalEquipmentConnectionLines(moduleSet, branchModuleIndex, groupIndex, shiftedCardIndex) {
      const branchModule = moduleSet.branchModuleCards[branchModuleIndex];
      const panelEquipmentGroup = branchModule.panelEquipmentGroups[groupIndex];
      const shiftDistance = 318; // 閥件寬度232 + 間距86
      
      // 更新後續設備卡片的連接線終點位置（只更新該分支的）
      moduleSet.connections.forEach(conn => {
        if ((conn.from === 'branch-panel-equipment-connection' || conn.from === 'branch-additional-equipment-valve') &&
            conn.to === 'branch-additional-equipment' &&
            conn.branchModuleIndex === branchModuleIndex &&
            conn.panelEquipmentGroupIndex === groupIndex &&
            conn.equipmentCardIndex !== undefined &&
            conn.equipmentCardIndex > shiftedCardIndex) {
          
          // 更新連接線結束位置（設備已經右移了shiftDistance）
          if (conn.toPosition) {
            conn.toPosition.x += shiftDistance;
          } else {
            // 如果沒有 toPosition，從設備卡片位置計算
            const equipmentCardIndex = conn.equipmentCardIndex;
            if (equipmentCardIndex !== undefined && panelEquipmentGroup.additionalEquipmentCards && 
                panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex]) {
              const equipmentCard = panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex];
              conn.toPosition = {
                x: equipmentCard.position.x,
                y: equipmentCard.position.y + CARD_HEIGHT_OFFSET
              };
            }
          }
        }
      });
    },
    
    /**
     * 更新連接線配置以適應 panel 和額外設備卡片之間的閥件
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - Panel+Equipment 群組索引
     * @param {number} equipmentCardIndex - 設備卡片索引
     */
    updateConnectionsForAdditionalEquipmentValve(moduleSet, groupIndex, equipmentCardIndex) {
      // 查找對應的額外設備卡片連接線
      const connectionIndex = moduleSet.connections.findIndex(conn => 
        (conn.from === 'panel-equipment-connection' || conn.from === 'panel-equipment-valve') &&
        conn.to === 'additional-equipment' &&
        conn.groupIndex === groupIndex &&
        conn.equipmentCardIndex === equipmentCardIndex
      );

      if (connectionIndex !== -1) {
        // 插入新的連接線：panel → valve → equipment
        const oldConnection = moduleSet.connections[connectionIndex];
        
        // 獲取 valve 和 equipment 的位置
        const panelEquipmentGroup = moduleSet.panelEquipmentGroups[groupIndex];
        const equipmentCard = panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex];
        const valve = equipmentCard.valve;
        
        moduleSet.connections.splice(connectionIndex, 1);

        // 確定起始點：如果原本是從 panel-equipment-valve（即主設備已經有閥件），則從主閥件出發
        // 否則從 panel 出發
        let connectionFrom = 'panel';
        if (oldConnection.from === 'panel-equipment-valve') {
          connectionFrom = 'panel-equipment-valve';
        }

        // 添加 panel → valve 連接（保留紫色 icon，但不顯示 add icon）
        moduleSet.connections.push({
          from: connectionFrom,
          to: 'additional-equipment-valve',
          groupIndex: groupIndex,
          equipmentCardIndex: equipmentCardIndex,
          showAdditionalIcon: false,
          showFaIcon: true,
          fromPosition: oldConnection.fromPosition // 使用原連接的起始位置
        });

        // 添加 valve → equipment 連接（不顯示 icon）
        moduleSet.connections.push({
          from: 'additional-equipment-valve',
          to: 'additional-equipment',
          groupIndex: groupIndex,
          equipmentCardIndex: equipmentCardIndex,
          showAdditionalIcon: false,
          showFaIcon: false,
          fromPosition: {
            x: valve.position.x + CARD_WIDTH,
            y: valve.position.y + CARD_HEIGHT_OFFSET
          },
          toPosition: {
            x: equipmentCard.position.x,
            y: equipmentCard.position.y + CARD_HEIGHT_OFFSET
          }
        });
      }
    },
    
    /**
     * 更新其他額外設備卡片的連接線位置（當某個設備卡片添加閥件後，後續設備卡片右移，需要更新它們的連接線）
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - Panel+Equipment 群組索引
     * @param {number} shiftedCardIndex - 被推移的設備卡片索引
     */
    updateOtherAdditionalEquipmentConnectionLines(moduleSet, groupIndex, shiftedCardIndex) {
      const panelEquipmentGroup = moduleSet.panelEquipmentGroups[groupIndex];
      const shiftDistance = 318; // 閥件寬度232 + 間距86
      
      // 更新後續設備卡片的連接線終點位置
      moduleSet.connections.forEach(conn => {
        if ((conn.from === 'panel-equipment-connection' || conn.from === 'panel-equipment-valve' || 
             conn.from === 'additional-equipment-valve') &&
            conn.to === 'additional-equipment' &&
            conn.groupIndex === groupIndex &&
            conn.equipmentCardIndex !== undefined &&
            conn.equipmentCardIndex > shiftedCardIndex) {
          
          // 更新連接線結束位置（設備已經右移了shiftDistance）
          if (conn.toPosition) {
            conn.toPosition.x += shiftDistance;
          } else {
            // 如果沒有 toPosition，從設備卡片位置計算
            const equipmentCardIndex = conn.equipmentCardIndex;
            if (equipmentCardIndex !== undefined && panelEquipmentGroup.additionalEquipmentCards && 
                panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex]) {
              const equipmentCard = panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex];
              conn.toPosition = {
                x: equipmentCard.position.x,
                y: equipmentCard.position.y + CARD_HEIGHT_OFFSET
              };
            }
          }
        }
      });
    },
    
    /**
     * 更新連接線配置以適應 panel-equipment 之間的閥件
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - Panel+Equipment 群組索引
     */
    updateConnectionsForPanelEquipmentValve(moduleSet, groupIndex) {
      // 查找 panel → equipment 的連接線（支持默認 groupIndex 為 0 或 undefined）
      const connectionIndex = moduleSet.connections.findIndex(conn => 
        conn.from === 'panel' && conn.to === 'equipment' && 
        (conn.groupIndex === groupIndex || (groupIndex === 0 && conn.groupIndex === undefined))
      );

      if (connectionIndex !== -1) {
        // 插入新的連接線：panel → valve, valve → equipment
        const oldConnection = moduleSet.connections[connectionIndex];
        
        // 獲取 valve 和 equipment 的位置
        const panelEquipmentGroup = moduleSet.panelEquipmentGroups[groupIndex];
        const valve = panelEquipmentGroup.valve;
        const equipment = panelEquipmentGroup.equipment;
        
        moduleSet.connections.splice(connectionIndex, 1);

        // 添加 panel → valve 連接（保留 add icon 和紫色 icon）
        moduleSet.connections.push({
          from: 'panel',
          to: 'panel-equipment-valve',
          groupIndex: groupIndex,
          showAdditionalIcon: oldConnection.showAdditionalIcon,
          showFaIcon: oldConnection.showFaIcon
        });

        // 添加 valve → equipment 連接（不顯示 icon）
        // 設置 fromPosition 為閥件右側L
        moduleSet.connections.push({
          from: 'panel-equipment-valve',
          to: 'equipment',
          groupIndex: groupIndex,
          showAdditionalIcon: false,
          showFaIcon: false,
          fromPosition: {
            x: valve.position.x + CARD_WIDTH,
            y: valve.position.y + CARD_HEIGHT_OFFSET
          }
        });
      }
    },

    /**
     * 更新 Panel-Equipment 群組中額外設備卡片的連接線位置
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - Panel+Equipment 群組索引
     */
    updatePanelEquipmentAdditionalConnectionLines(moduleSet, groupIndex) {
      const panelEquipmentGroup = moduleSet.panelEquipmentGroups[groupIndex];
      
      if (!panelEquipmentGroup || !panelEquipmentGroup.valve) {
        return;
      }

      const valve = panelEquipmentGroup.valve;
      const shiftDistance = 318; // 閥件寬度232 + 間距86
      
      // 更新額外設備卡片的連接線
      moduleSet.connections.forEach(conn => {
        if (conn.from === 'panel-equipment-connection' && 
            conn.groupIndex === groupIndex && 
            conn.equipmentCardIndex !== undefined) {
          
          // 更新 from 為 panel-equipment-valve（從閥件出發）
          conn.from = 'panel-equipment-valve';
          
          // 更新連接線起始位置為 panel → valve 連接線上的位置
          const panelRightX = panelEquipmentGroup.panel.position.x + CARD_WIDTH;
          const panelY = panelEquipmentGroup.panel.position.y + CARD_HEIGHT_OFFSET;
          const valveLeftX = valve.position.x;
          
          // 計算 add icon 的位置（panel 和 valve 之間）
          const midX = panelRightX + (valveLeftX - panelRightX) * 0.9;
          const iconX = panelRightX + (midX - panelRightX) * 0.33;
          
          // 計算紫色圖標的位置
          const purpleIconX = panelRightX + (valveLeftX - panelRightX) * 0.67;
          
          // 連接線從 add icon 和 purple icon 之間的位置開始（選擇兩者中間）
          const connectionStartX = (iconX + purpleIconX) / 2;
          const connectionStartY = panelY;
          
          conn.fromPosition = {
            x: connectionStartX,
            y: connectionStartY
          };
          
          // 更新連接線結束位置（設備已經右移了shiftDistance）
          if (conn.toPosition) {
            conn.toPosition.x += shiftDistance;
          } else {
            // 如果沒有 toPosition，從設備卡片位置計算
            const equipmentCardIndex = conn.equipmentCardIndex;
            if (equipmentCardIndex !== undefined && panelEquipmentGroup.additionalEquipmentCards && panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex]) {
              const equipmentCard = panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex];
              conn.toPosition = {
                x: equipmentCard.position.x,
                y: equipmentCard.position.y + CARD_HEIGHT_OFFSET
              };
            }
          }
        }
      });
    },

    /**
     * 創建閥件卡片
     * @param {Object} moduleSet - 模組組對象
     * @returns {Object} 新的閥件卡片對象
     */
    createValveCard(moduleSet) {
      const pipelineCard = moduleSet.pipeline;
      
      return {
        id: `valve-card-${Date.now()}`,
        type: 'valve',
        position: { x: pipelineCard.position.x, y: pipelineCard.position.y }
      };
    },
    
    /**
     * 添加分支閥件卡片（包含完整的模組流程）
     * @param {Object} connection - 連接對象
     * @param {number} moduleSetIndex - 模組組索引
     */
    addBranchValveCard(connection, moduleSetIndex) {
      console.log(`添加分支閥件完整模組到模組組 ${moduleSetIndex}`);
      
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      
      if (!currentModuleSet) {
        console.error('找不到當前的模組組');
        return;
      }
      
      // 獲取最後一個閥件卡片的位置（用於X軸定位）
      const lastValveCard = currentModuleSet.valveCards[currentModuleSet.valveCards.length - 1];
      
      // 計算分支閥件的Y位置
      let branchValveY;
      if (currentModuleSet.branchModuleCards && currentModuleSet.branchModuleCards.length > 0) {
        // 如果已經有分支閥件群組，計算最後一個群組的最大底部位置
        const lastBranchModule = currentModuleSet.branchModuleCards[currentModuleSet.branchModuleCards.length - 1];
        
        // 找到最後一個分支模組中最後一個 panel-equipment 群組
        let lastBranchMaxBottomY = lastBranchModule.valve.position.y;
        if (lastBranchModule.panelEquipmentGroups && lastBranchModule.panelEquipmentGroups.length > 0) {
          const lastGroup = lastBranchModule.panelEquipmentGroups[lastBranchModule.panelEquipmentGroups.length - 1];
          const groupPanelBottomY = lastGroup.panel.position.y + this.getCardHeight('panel');
          const groupEquipmentBottomY = lastGroup.equipment.position.y + this.getCardHeight('equipment');
          let groupMaxBottomY = Math.max(groupPanelBottomY, groupEquipmentBottomY);
          
          // 如果有額外的設備卡片，檢查它們的最底部位置
          if (lastGroup.additionalEquipmentCards && lastGroup.additionalEquipmentCards.length > 0) {
            lastGroup.additionalEquipmentCards.forEach(card => {
              const cardBottomY = card.position.y + this.getCardHeight('equipment');
              groupMaxBottomY = Math.max(groupMaxBottomY, cardBottomY);
            });
          }
          
          lastBranchMaxBottomY = groupMaxBottomY;
        }
        
        // 在最後一個分支閥件群組下方添加新的分支閥件
        branchValveY = lastBranchMaxBottomY + BRANCH_VALVE_SPACING;
        
        console.log('添加第二個分支閥件，基於最後一個分支閥件群組:', {
          lastBranchMaxBottomY,
          branchValveY,
          branchCount: currentModuleSet.branchModuleCards.length
        });
      } else {
        // 如果沒有分支閥件群組，使用主分支高度計算
        branchValveY = this.calculateBranchValveYPosition(currentModuleSet);
        
        console.log('添加第一個分支閥件，基於主分支高度:', {
          branchValveY
        });
      }
      
      // 創建分支閥件卡片
      const newBranchValveCard = {
        id: `branch-valve-card-${Date.now()}`,
        type: 'branch-valve',
        position: { x: lastValveCard.position.x, y: branchValveY },
        data: {
          connectorType: '',
          size: '',
          valveType: '',
          enableValve: false,
          branchSize: ''
        }
      };
      
      // 創建分支模組的後續卡片
      const branchModuleCards = this.createBranchModuleCards(newBranchValveCard);
      
      // 將分支閥件添加到閥件卡片數組
      currentModuleSet.valveCards.push(newBranchValveCard);
      
      // 添加分支模組的後續卡片到對應數組
      this.addBranchModuleCards(currentModuleSet, branchModuleCards);
      
      // 添加分支閥件的連接線
      this.addBranchValveConnection(currentModuleSet, newBranchValveCard, moduleSetIndex);
      
      // 添加分支模組內部的連接線
      this.addBranchModuleConnections(currentModuleSet, branchModuleCards, moduleSetIndex);
      
      // 更新所有分支閥件的位置（確保與主分支對齊）
      this.updateAllBranchValvePositions(currentModuleSet);
      
      // 更新所有設備卡片的連接線位置（影響所有分支）
      if (currentModuleSet.branchModuleCards && currentModuleSet.branchModuleCards.length > 0) {
        currentModuleSet.branchModuleCards.forEach((_, index) => {
          this.updateAdditionalEquipmentConnectionLines(currentModuleSet, index);
        });
      }
      // 更新主分支的設備卡片連接線
      this.updateAdditionalEquipmentConnectionLines(currentModuleSet, -1);
      
      // 更新所有模組組的位置（因為該模組組高度可能改變）
      this.updateAllModuleSetPositions();
      
      console.log(`已在模組組 ${moduleSetIndex} 中添加分支閥件完整模組:`, {
        branchValve: newBranchValveCard,
        moduleCards: branchModuleCards
      });
    },
    
    /**
     * 計算分支閥件的Y位置（在主分支最下方，包括所有Panel+Equipment群組）
     * @param {Object} moduleSet - 模組組對象
     * @returns {number} 分支閥件的Y位置
     */
    calculateBranchValveYPosition(moduleSet) {
      // 計算主分支的最大底部位置（包括所有Panel+Equipment群組）
      let maxBottomY = 0;
      
      // 獲取主要卡片的底部位置
      const sourceBottomY = moduleSet.source.position.y + this.getCardHeight('source');
      const pipelineBottomY = moduleSet.pipeline.position.y + this.getCardHeight('pipeline');
      const floorBottomY = moduleSet.floor.position.y + this.getCardHeight('floor');
      
      maxBottomY = Math.max(maxBottomY, sourceBottomY, pipelineBottomY, floorBottomY);
      
      // 計算Panel+Equipment群組的最大底部位置（檢查所有群組，包括額外的設備卡片）
      if (moduleSet.panelEquipmentGroups && moduleSet.panelEquipmentGroups.length > 0) {
        // 遍歷所有群組，找到最底部的Y位置（包括額外的設備卡片）
        moduleSet.panelEquipmentGroups.forEach(group => {
          const panelBottomY = group.panel.position.y + this.getCardHeight('panel');
          const equipmentBottomY = group.equipment.position.y + this.getCardHeight('equipment');
          let groupMaxBottomY = Math.max(panelBottomY, equipmentBottomY);
          
          // 如果有額外的設備卡片，檢查它們的最底部位置
          if (group.additionalEquipmentCards && group.additionalEquipmentCards.length > 0) {
            group.additionalEquipmentCards.forEach(card => {
              const cardBottomY = card.position.y + this.getCardHeight('equipment');
              groupMaxBottomY = Math.max(groupMaxBottomY, cardBottomY);
            });
          }
          
          maxBottomY = Math.max(maxBottomY, groupMaxBottomY);
        });
      }
      
      // 計算分支閥件與主分支之間的間距（第一個分支使用較小的間距）
      const branchSpacing = FIRST_BRANCH_VALVE_SPACING;
      
      // 計算主分支增高的額外間距（Panel+Equipment 群組的增長高度）
      const extraHeight = this.calculateExtraHeightForBranch(moduleSet);
      
      // 在主分支最大底部位置下方使用第一個分支的間距，再加上額外高度
      const branchValveY = maxBottomY + branchSpacing + extraHeight;
      
      console.log('計算分支閥件Y位置 (基於主分支高度):', {
        sourceBottomY,
        pipelineBottomY,
        floorBottomY,
        lastGroupMaxBottomY: moduleSet.panelEquipmentGroups?.length > 0 ? 
          Math.max(
            moduleSet.panelEquipmentGroups[moduleSet.panelEquipmentGroups.length - 1].panel.position.y + this.getCardHeight('panel'),
            moduleSet.panelEquipmentGroups[moduleSet.panelEquipmentGroups.length - 1].equipment.position.y + this.getCardHeight('equipment')
          ) : 0,
        maxBottomY,
        branchSpacing,
        extraHeight,
        branchValveY,
        panelEquipmentGroupsCount: moduleSet.panelEquipmentGroups?.length || 0
      });
      
      return branchValveY;
    },
    
    /**
     * 計算主分支增高時的額外間距
     * @param {Object} moduleSet - 模組組對象
     * @returns {number} 額外間距
     */
    calculateExtraHeightForBranch(moduleSet) {
      // 如果 Panel+Equipment 群組數量大於1，表示主分支增高了
      if (moduleSet.panelEquipmentGroups && moduleSet.panelEquipmentGroups.length > 1) {
        // 計算第一群組到底部群組之間的距離
        const firstGroup = moduleSet.panelEquipmentGroups[0];
        const lastGroup = moduleSet.panelEquipmentGroups[moduleSet.panelEquipmentGroups.length - 1];
        
        const firstGroupBottomY = Math.max(
          firstGroup.panel.position.y + this.getCardHeight('panel'),
          firstGroup.equipment.position.y + this.getCardHeight('equipment')
        );
        
        const lastGroupTopY = Math.min(lastGroup.panel.position.y, lastGroup.equipment.position.y);
        
        const extraSpacing = lastGroupTopY - firstGroupBottomY;
        
        // 返回額外的 355 間距
        return 355;
      }
      
      return 0;
    },
    
    /**
     * 計算主分支卡片之間的距離
     * @param {Object} moduleSet - 模組組對象
     * @returns {number} 主分支卡片之間的距離
     */
    calculateMainBranchSpacing(moduleSet) {
      // 計算源頭資訊到管線資訊的距離
      const sourceToPipelineDistance = moduleSet.pipeline.position.y - moduleSet.source.position.y;
      
      // 計算管線資訊到樓層資訊的距離
      const pipelineToFloorDistance = moduleSet.floor.position.y - moduleSet.pipeline.position.y;
      
      // 計算樓層資訊到盤面的距離
      let floorToPanelDistance = 0;
      if (moduleSet.panelEquipmentGroups && moduleSet.panelEquipmentGroups.length > 0) {
        const firstPanel = moduleSet.panelEquipmentGroups[0].panel;
        floorToPanelDistance = firstPanel.position.y - moduleSet.floor.position.y;
      }
      
      // 使用平均距離作為主分支距離
      const distances = [sourceToPipelineDistance, pipelineToFloorDistance, floorToPanelDistance].filter(d => d > 0);
      const averageSpacing = distances.length > 0 ? distances.reduce((sum, d) => sum + d, 0) / distances.length : 50;
      
      console.log('計算主分支距離:', {
        sourceToPipelineDistance,
        pipelineToFloorDistance,
        floorToPanelDistance,
        averageSpacing
      });
      
      return averageSpacing;
    },
    
    /**
     * 更新所有分支閥件的位置
     * @param {Object} moduleSet - 模組組對象
     */
    updateAllBranchValvePositions(moduleSet) {
      console.log('更新所有分支閥件位置');
      
      if (!moduleSet.branchModuleCards || moduleSet.branchModuleCards.length === 0) {
        console.log('沒有分支閥件需要更新');
        return;
      }
      
      // 計算第一個分支閥件應該在的位置（基於當前主分支高度）
      const firstBranchValveY = this.calculateBranchValveYPosition(moduleSet);
      
      // 計算每個分支閥件及其相關卡片的位置
      let currentBaseY = firstBranchValveY;
      
      moduleSet.branchModuleCards.forEach((branchModule, index) => {
        const currentY = branchModule.valve.position.y;
        
        // 計算新位置
        const newBranchValveY = index === 0 ? firstBranchValveY : currentBaseY + BRANCH_VALVE_SPACING;
        
        // 保存原始位置，用於計算相對位置
        const originalValveY = branchModule.valve.position.y;
        
        console.log(`分支閥件 ${index}: 當前Y=${currentY}, 新Y=${newBranchValveY}, 移動=${newBranchValveY - currentY}`);
        
        // 更新分支閥件卡片的位置（在valveCards中）
        if (moduleSet.valveCards && moduleSet.valveCards.length > 0) {
          const branchValveInValveCards = moduleSet.valveCards.find(valveCard => 
            valveCard.type === 'branch-valve' &&
            valveCard.position.x === branchModule.valve.position.x &&
            Math.abs(valveCard.position.y - currentY) < 1
          );
          
          if (branchValveInValveCards) {
            branchValveInValveCards.position.y = newBranchValveY;
          }
        }
        
        // 更新分支模組內所有卡片的位置
        branchModule.valve.position.y = newBranchValveY;
        branchModule.pipeline.position.y = newBranchValveY;
        branchModule.floor.position.y = newBranchValveY;
        
        // 更新所有 panel-equipment 群組的位置（與主分支對齊）
        if (branchModule.panelEquipmentGroups && branchModule.panelEquipmentGroups.length > 0) {
          branchModule.panelEquipmentGroups.forEach((group, groupIndex) => {
            // 第一個群組應該與主分支對應群組對齊
            if (groupIndex === 0) {
              // 獲取主分支對應的群組，確保與主分支對齊
              const mainGroup = moduleSet.panelEquipmentGroups && moduleSet.panelEquipmentGroups[groupIndex] 
                ? moduleSet.panelEquipmentGroups[groupIndex] 
                : null;
              
              if (mainGroup) {
                // 與主分支的第一個群組對齊（閥件對閥件、設備對設備）
                group.panel.position.y = mainGroup.panel.position.y;
                group.equipment.position.y = mainGroup.equipment.position.y;
              } else {
                // 如果主分支沒有對應群組，使用分支閥件位置
                group.panel.position.y = newBranchValveY;
                group.equipment.position.y = newBranchValveY;
              }
              
              // 更新額外的設備卡片位置（與主分支對齊：閥件對閥件、設備對設備）
              if (group.additionalEquipmentCards && group.additionalEquipmentCards.length > 0) {
                // 獲取主分支對應的群組
                const mainGroup = moduleSet.panelEquipmentGroups && moduleSet.panelEquipmentGroups[groupIndex] 
                  ? moduleSet.panelEquipmentGroups[groupIndex] 
                  : null;
                
                group.additionalEquipmentCards.forEach((card, cardIndex) => {
                  // 檢查主分支是否有對應位置的設備卡片
                  if (mainGroup && mainGroup.additionalEquipmentCards && 
                      cardIndex < mainGroup.additionalEquipmentCards.length) {
                    // 主分支有對應位置的設備卡片，使用其位置對齊（X和Y都對齊）
                    const mainEquipmentCard = mainGroup.additionalEquipmentCards[cardIndex];
                    card.position.x = mainEquipmentCard.position.x; // 設備對設備：X軸對齊
                    card.position.y = mainEquipmentCard.position.y; // 設備對設備：Y軸對齊
                    
                    // 如果該設備卡片有閥件，也需要對齊主分支對應位置的閥件
                    if (card.valve && mainEquipmentCard.valve) {
                      card.valve.position.x = mainEquipmentCard.valve.position.x; // 閥件對閥件：X軸對齊
                      card.valve.position.y = mainEquipmentCard.valve.position.y; // 閥件對閥件：Y軸對齊
                    } else if (card.valve && !mainEquipmentCard.valve) {
                      // 如果分支有閥件但主分支沒有，閥件X位置應該對齊主分支equipment位置
                      card.valve.position.x = mainGroup.equipment.position.x;
                      card.valve.position.y = mainEquipmentCard.position.y; // Y軸與設備對齊
                    }
                  } else if (mainGroup && mainGroup.additionalEquipmentCards && mainGroup.additionalEquipmentCards.length > 0) {
                    // 主分支有設備卡片但沒有對應索引的卡片，與主分支最後一個設備卡片對齊Y軸模式
                    const lastMainCard = mainGroup.additionalEquipmentCards[mainGroup.additionalEquipmentCards.length - 1];
                    const equipmentCardHeight = this.getCardHeight('equipment');
                    const spacing = 50;
                    // 計算應該對齊的位置：基於主分支最後一個卡片的位置 + 間距
                    const offsetFromMainLast = cardIndex - (mainGroup.additionalEquipmentCards.length - 1);
                    card.position.y = lastMainCard.position.y + (offsetFromMainLast * (equipmentCardHeight + spacing));
                    card.position.x = lastMainCard.position.x; // X軸與主分支最後一個卡片對齊
                    
                    // 如果有閥件，也需要處理
                    if (card.valve) {
                      // 如果主分支最後一個卡片有閥件，閥件對齊主分支閥件位置
                      if (lastMainCard.valve) {
                        card.valve.position.x = lastMainCard.valve.position.x;
                      } else {
                        card.valve.position.x = mainGroup.equipment.position.x;
                      }
                      card.valve.position.y = card.position.y; // Y軸與設備對齊
                    }
                  } else {
                    // 主分支沒有任何設備卡片，基於前一個卡片位置計算
                    const equipmentCardHeight = this.getCardHeight('equipment');
                    const spacing = 50;
                    if (cardIndex === 0) {
                      // 第一個設備卡片基於 equipment 位置
                      card.position.y = group.equipment.position.y + equipmentCardHeight + spacing;
                    } else {
                      // 後續設備卡片基於前一個卡片的位置
                      const prevCard = group.additionalEquipmentCards[cardIndex - 1];
                      card.position.y = prevCard.position.y + equipmentCardHeight + spacing;
                    }
                  }
                });
              }
            } else {
              // 其他群組應該與主分支對應群組對齊
              const mainGroup = moduleSet.panelEquipmentGroups && moduleSet.panelEquipmentGroups[groupIndex] 
                ? moduleSet.panelEquipmentGroups[groupIndex] 
                : null;
              
              if (mainGroup) {
                // 與主分支的對應群組對齊（閥件對閥件、設備對設備）
                group.panel.position.y = mainGroup.panel.position.y;
                group.equipment.position.y = mainGroup.equipment.position.y;
              } else {
                // 如果主分支沒有對應群組，保持與第一個群組的相對位置
                const relativeY = group.panel.position.y - originalValveY;
                group.panel.position.y = newBranchValveY + relativeY;
                group.equipment.position.y = newBranchValveY + relativeY;
              }
              
              // 更新額外的設備卡片位置（與主分支對齊：閥件對閥件、設備對設備）
              if (group.additionalEquipmentCards && group.additionalEquipmentCards.length > 0) {
                // 獲取主分支對應的群組
                const mainGroup = moduleSet.panelEquipmentGroups && moduleSet.panelEquipmentGroups[groupIndex] 
                  ? moduleSet.panelEquipmentGroups[groupIndex] 
                  : null;
                
                group.additionalEquipmentCards.forEach((card, cardIndex) => {
                  // 檢查主分支是否有對應位置的設備卡片
                  if (mainGroup && mainGroup.additionalEquipmentCards && 
                      cardIndex < mainGroup.additionalEquipmentCards.length) {
                    // 主分支有對應位置的設備卡片，使用其位置對齊（X和Y都對齊）
                    const mainEquipmentCard = mainGroup.additionalEquipmentCards[cardIndex];
                    card.position.x = mainEquipmentCard.position.x; // 設備對設備：X軸對齊
                    card.position.y = mainEquipmentCard.position.y; // 設備對設備：Y軸對齊
                    
                    // 如果該設備卡片有閥件，也需要對齊主分支對應位置的閥件
                    if (card.valve && mainEquipmentCard.valve) {
                      card.valve.position.x = mainEquipmentCard.valve.position.x; // 閥件對閥件：X軸對齊
                      card.valve.position.y = mainEquipmentCard.valve.position.y; // 閥件對閥件：Y軸對齊
                    } else if (card.valve && !mainEquipmentCard.valve) {
                      // 如果分支有閥件但主分支沒有，閥件X位置應該對齊主分支equipment位置
                      card.valve.position.x = mainGroup.equipment.position.x;
                      card.valve.position.y = mainEquipmentCard.position.y; // Y軸與設備對齊
                    }
                  } else if (mainGroup && mainGroup.additionalEquipmentCards && mainGroup.additionalEquipmentCards.length > 0) {
                    // 主分支有設備卡片但沒有對應索引的卡片，與主分支最後一個設備卡片對齊Y軸模式
                    const lastMainCard = mainGroup.additionalEquipmentCards[mainGroup.additionalEquipmentCards.length - 1];
                    const equipmentCardHeight = this.getCardHeight('equipment');
                    const spacing = 50;
                    // 計算應該對齊的位置：基於主分支最後一個卡片的位置 + 間距
                    const offsetFromMainLast = cardIndex - (mainGroup.additionalEquipmentCards.length - 1);
                    card.position.y = lastMainCard.position.y + (offsetFromMainLast * (equipmentCardHeight + spacing));
                    card.position.x = lastMainCard.position.x; // X軸與主分支最後一個卡片對齊
                    
                    // 如果有閥件，也需要處理
                    if (card.valve) {
                      // 如果主分支最後一個卡片有閥件，閥件對齊主分支閥件位置
                      if (lastMainCard.valve) {
                        card.valve.position.x = lastMainCard.valve.position.x;
                      } else {
                        card.valve.position.x = mainGroup.equipment.position.x;
                      }
                      card.valve.position.y = card.position.y; // Y軸與設備對齊
                    }
                  } else {
                    // 主分支沒有任何設備卡片，保持相對位置
                    const equipmentCardHeight = this.getCardHeight('equipment');
                    const spacing = 50;
                    // 第一個設備卡片的相對位置
                    const firstAdditionalCardOriginalY = group.additionalEquipmentCards[0].position.y;
                    const firstAdditionalCardOriginalRelativeY = firstAdditionalCardOriginalY - originalValveY;
                    const firstCardNewY = newBranchValveY + firstAdditionalCardOriginalRelativeY;
                    
                    if (cardIndex === 0) {
                      card.position.y = firstCardNewY;
                    } else {
                      // 後續設備卡片基於前一個卡片的位置
                      const prevCard = group.additionalEquipmentCards[cardIndex - 1];
                      card.position.y = prevCard.position.y + equipmentCardHeight + spacing;
                    }
                  }
                });
              }
            }
          });
        }
        
        // 計算該分支的最大高度（在更新位置後）
        // 檢查所有群組及其額外設備卡片，找到最底部的Y位置
        let maxHeight = 0;
        if (branchModule.panelEquipmentGroups && branchModule.panelEquipmentGroups.length > 0) {
          let branchMaxBottomY = newBranchValveY;
          
          // 遍歷所有群組，找到最底部的Y位置（包括額外的設備卡片）
          branchModule.panelEquipmentGroups.forEach(group => {
            const panelBottomY = group.panel.position.y + this.getCardHeight('panel');
            const equipmentBottomY = group.equipment.position.y + this.getCardHeight('equipment');
            let groupMaxBottomY = Math.max(panelBottomY, equipmentBottomY);
            
            // 如果有額外的設備卡片，檢查它們的最底部位置
            if (group.additionalEquipmentCards && group.additionalEquipmentCards.length > 0) {
              group.additionalEquipmentCards.forEach(card => {
                const cardBottomY = card.position.y + this.getCardHeight('equipment');
                groupMaxBottomY = Math.max(groupMaxBottomY, cardBottomY);
              });
            }
            
            branchMaxBottomY = Math.max(branchMaxBottomY, groupMaxBottomY);
          });
          
          maxHeight = branchMaxBottomY - newBranchValveY;
        } else {
          maxHeight = Math.max(
            this.getCardHeight('valve'),
            this.getCardHeight('pipeline'),
            this.getCardHeight('floor')
          );
        }
        
        // 更新當前分支的最大底部位置，用於計算下一個分支的位置
        const branchBottomY = newBranchValveY + maxHeight;
        if (index === 0) {
          currentBaseY = branchBottomY;
        } else {
          currentBaseY = Math.max(currentBaseY, branchBottomY);
        }
        
        // 更新連接線的位置
        this.updateBranchValveConnectionPositions(moduleSet, index);
        
        // 注意：這裡不更新設備卡片連接線，因為分支位置可能還會改變
        // 將在所有分支位置更新完成後統一更新
      });
      
      // 所有分支位置更新完成後，統一更新所有分支的設備卡片連接線
      // 這樣可以確保連接線基於最終正確的位置
      if (moduleSet.branchModuleCards && moduleSet.branchModuleCards.length > 0) {
        moduleSet.branchModuleCards.forEach((_, index) => {
          this.updateAdditionalEquipmentConnectionLines(moduleSet, index);
        });
      }
      
      console.log('已更新所有分支閥件位置', {
        分支數量: moduleSet.branchModuleCards.length,
        第一個分支閥件Y: firstBranchValveY
      });
    },
    
    /**
     * 更新分支閥件連接線的位置
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchModuleIndex - 分支模組索引
     */
    updateBranchValveConnectionPositions(moduleSet, branchModuleIndex) {
      console.log(`更新分支閥件 ${branchModuleIndex} 的連接線位置`);
      
      const branchValveCard = moduleSet.branchModuleCards[branchModuleIndex];
      if (!branchValveCard) {
        return;
      }
      
      moduleSet.connections.forEach(conn => {
        // 更新從源頭到分支閥件的連接線終點
        // 檢查連接線是否對應這個分支模組
        const isThisBranchModuleConnection = 
          (conn.from === 'source' && conn.to === 'branch-valve') ||
          (conn.branchModuleIndex === branchModuleIndex);
        
        if (isThisBranchModuleConnection) {
          // 更新連接線的終點位置（從源頭到分支閥件）
          if (conn.to === 'branch-valve' && conn.toPosition) {
            conn.toPosition.y = branchValveCard.valve.position.y + CARD_HEIGHT_OFFSET;
          }
        }
      });
    },
    
    /**
     * 更新額外設備卡片的連接線位置
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchModuleIndex - 分支模組索引（如果是主分支則為 -1）
     */
    updateAdditionalEquipmentConnectionLines(moduleSet, branchModuleIndex) {
      // 更新主分支的設備卡片連接線
      if (branchModuleIndex === -1 || branchModuleIndex === undefined) {
        if (moduleSet.panelEquipmentGroups) {
          moduleSet.panelEquipmentGroups.forEach((group, groupIndex) => {
            if (group.additionalEquipmentCards && group.additionalEquipmentCards.length > 0) {
              this.updateGroupEquipmentConnectionLines(moduleSet, group, groupIndex, -1, false);
            }
          });
        }
      } else {
        // 更新分支的設備卡片連接線
        const branchModule = moduleSet.branchModuleCards[branchModuleIndex];
        if (branchModule && branchModule.panelEquipmentGroups) {
          console.log(`更新分支 ${branchModuleIndex} 的設備卡片連接線，群組數量: ${branchModule.panelEquipmentGroups.length}`);
          branchModule.panelEquipmentGroups.forEach((group, groupIndex) => {
            // 無論是否有額外設備卡片，都更新該群組的連接線（因為 panel 位置可能改變了）
            // 這確保了即使第一個設備卡片的連接線（從 panel 到 equipment）也會更新
            if (group.additionalEquipmentCards && group.additionalEquipmentCards.length > 0) {
              console.log(`  群組 ${groupIndex} 有 ${group.additionalEquipmentCards.length} 個額外設備卡片`);
            } else {
              console.log(`  群組 ${groupIndex} 沒有額外設備卡片`);
            }
            // 強制更新該群組的所有連接線
            console.log(`  開始更新分支 ${branchModuleIndex} 群組 ${groupIndex} 的連接線`);
            console.log(`    群組 panel 位置: (${group.panel.position.x}, ${group.panel.position.y})`);
            console.log(`    群組 equipment 位置: (${group.equipment.position.x}, ${group.equipment.position.y})`);
            this.updateGroupEquipmentConnectionLines(moduleSet, group, groupIndex, branchModuleIndex, true);
          });
        } else {
          console.log(`分支 ${branchModuleIndex} 不存在或沒有 panelEquipmentGroups`);
        }
      }
    },
    
    /**
     * 更新群組的設備卡片連接線位置（統一方法）
     * @param {Object} moduleSet - 模組組對象
     * @param {Object} group - Panel+Equipment 群組
     * @param {number} groupIndex - 群組索引
     * @param {number} branchModuleIndex - 分支模組索引（-1 表示主分支）
     * @param {boolean} isBranch - 是否為分支
     */
    updateGroupEquipmentConnectionLines(moduleSet, group, groupIndex, branchModuleIndex, isBranch = false) {
      // 計算連接線起始位置
      const panelRightX = group.panel.position.x + CARD_WIDTH;
      const panelY = group.panel.position.y + CARD_HEIGHT_OFFSET;
      const equipmentLeftX = group.equipment.position.x;
      
      const midX = panelRightX + (equipmentLeftX - panelRightX) * 0.9;
      const iconX = panelRightX + (midX - panelRightX) * 0.33;
      const purpleIconX = panelRightX + (equipmentLeftX - panelRightX) * 0.67;
      
      const connectionStartX = (iconX + purpleIconX) / 2;
      const connectionStartY = panelY;
      
      // 更新該群組的設備卡片連接線
      let foundConnections = 0;
      let checkedConnections = 0;
      let allBranchConnections = [];
      
      // 先收集所有分支連接線，方便調試
      if (isBranch) {
        moduleSet.connections.forEach((conn, idx) => {
          if (conn.from === 'branch-panel-equipment-connection') {
            allBranchConnections.push({
              index: idx,
              branchIndex: conn.branchModuleIndex,
              groupIndex: conn.panelEquipmentGroupIndex,
              cardIndex: conn.equipmentCardIndex
            });
          }
        });
        console.log(`查找分支 ${branchModuleIndex} 群組 ${groupIndex} 的連接線，所有分支連接線:`, allBranchConnections);
      }
      
      moduleSet.connections.forEach((conn, connIndex) => {
        if (isBranch) {
          // 分支設備卡片連接線
          if (conn.from === 'branch-panel-equipment-connection') {
            checkedConnections++;
            // 檢查是否匹配當前分支和群組
            const matchesBranch = conn.branchModuleIndex === branchModuleIndex;
            const matchesGroup = conn.panelEquipmentGroupIndex === groupIndex;
            
            console.log(`檢查連接線 #${connIndex}: branchIndex=${conn.branchModuleIndex}===${branchModuleIndex}? ${matchesBranch}, groupIndex=${conn.panelEquipmentGroupIndex}===${groupIndex}? ${matchesGroup}`);
            
            if (matchesBranch && matchesGroup) {
              const equipmentCardIndex = conn.equipmentCardIndex;
              console.log(`[匹配] 連接線 #${connIndex}: branchIndex=${conn.branchModuleIndex}, groupIndex=${conn.panelEquipmentGroupIndex}, cardIndex=${equipmentCardIndex}, 群組設備卡片數=${group.additionalEquipmentCards?.length || 0}`);
              if (equipmentCardIndex !== undefined && 
                  group.additionalEquipmentCards && 
                  group.additionalEquipmentCards.length > equipmentCardIndex &&
                  group.additionalEquipmentCards[equipmentCardIndex]) {
                const card = group.additionalEquipmentCards[equipmentCardIndex];
                const oldFromPosition = conn.fromPosition ? { ...conn.fromPosition } : null;
                conn.fromPosition = { x: connectionStartX, y: connectionStartY };
                conn.toPosition = { x: card.position.x, y: card.position.y + CARD_HEIGHT_OFFSET };
                foundConnections++;
                console.log(`  ✓ 已更新連接線 #${connIndex}: cardIndex=${equipmentCardIndex}`);
                console.log(`    舊起點: ${oldFromPosition ? `(${oldFromPosition.x}, ${oldFromPosition.y})` : 'null'}`);
                console.log(`    新起點: (${connectionStartX}, ${connectionStartY})`);
                console.log(`    終點: (${card.position.x}, ${card.position.y + CARD_HEIGHT_OFFSET})`);
              } else {
                console.log(`  ✗ 跳過連接線 #${connIndex}: cardIndex=${equipmentCardIndex}, 原因: 卡片不存在或索引無效`);
                console.log(`    群組設備卡片數: ${group.additionalEquipmentCards?.length || 0}, 卡片數組:`, group.additionalEquipmentCards);
              }
            } else if (matchesBranch && !matchesGroup) {
              console.log(`[不匹配群組] 連接線 #${connIndex}: branchIndex=${conn.branchModuleIndex}, groupIndex=${conn.panelEquipmentGroupIndex} (期望: ${groupIndex})`);
            } else if (!matchesBranch) {
              console.log(`[不匹配分支] 連接線 #${connIndex}: branchIndex=${conn.branchModuleIndex} (期望: ${branchModuleIndex})`);
            }
          }
          
          // 處理分支設備卡片上的閥件連接線（branch-panel-equipment-connection → branch-additional-equipment-valve）
          if ((conn.from === 'branch-panel-equipment-connection') &&
              conn.to === 'branch-additional-equipment-valve' &&
              conn.branchModuleIndex === branchModuleIndex &&
              conn.panelEquipmentGroupIndex === groupIndex &&
              conn.equipmentCardIndex !== undefined) {
            const equipmentCardIndex = conn.equipmentCardIndex;
            if (equipmentCardIndex !== undefined && group.additionalEquipmentCards && 
                equipmentCardIndex < group.additionalEquipmentCards.length &&
                group.additionalEquipmentCards[equipmentCardIndex] &&
                group.additionalEquipmentCards[equipmentCardIndex].valve) {
              const valve = group.additionalEquipmentCards[equipmentCardIndex].valve;
              
              // 保持原始連接線的起點位置（絕對不重新計算）
              // fromPosition 已經在添加閥件時設置為原始連接線的起點，這裡保持不變
              // 不要修改 conn.fromPosition，確保紫色 icon 位置與原始連接線一致
              // 只更新 toPosition（閥件位置可能因為對齊而改變）
              conn.toPosition = { 
                x: valve.position.x, 
                y: valve.position.y + CARD_HEIGHT_OFFSET 
              };
            }
          }
          
          // 處理分支設備卡片閥件 → 設備卡片的連接線
          if (conn.from === 'branch-additional-equipment-valve' &&
              conn.to === 'branch-additional-equipment' &&
              conn.branchModuleIndex === branchModuleIndex &&
              conn.panelEquipmentGroupIndex === groupIndex &&
              conn.equipmentCardIndex !== undefined) {
            const equipmentCardIndex = conn.equipmentCardIndex;
            if (equipmentCardIndex !== undefined && group.additionalEquipmentCards && 
                equipmentCardIndex < group.additionalEquipmentCards.length &&
                group.additionalEquipmentCards[equipmentCardIndex]) {
              const card = group.additionalEquipmentCards[equipmentCardIndex];
              
              if (card.valve) {
                conn.fromPosition = { 
                  x: card.valve.position.x + CARD_WIDTH, 
                  y: card.valve.position.y + CARD_HEIGHT_OFFSET 
                };
                conn.toPosition = { 
                  x: card.position.x, 
                  y: card.position.y + CARD_HEIGHT_OFFSET 
                };
              }
            }
          }
        } else {
          // 主分支設備卡片連接線
          // 處理從 panel 或 panel-equipment-valve 連接到額外設備卡片的連接線（沒有閥件的情況）
          if ((conn.from === 'panel-equipment-connection' || conn.from === 'panel-equipment-valve') && 
              conn.groupIndex === groupIndex &&
              conn.to === 'additional-equipment') {
            const equipmentCardIndex = conn.equipmentCardIndex;
            if (equipmentCardIndex !== undefined && group.additionalEquipmentCards && 
                equipmentCardIndex < group.additionalEquipmentCards.length &&
                group.additionalEquipmentCards[equipmentCardIndex]) {
              const card = group.additionalEquipmentCards[equipmentCardIndex];
              
              // 重新計算連接線起始位置（考慮是否有主設備閥件）
              let fromPosX = connectionStartX;
              let fromPosY = connectionStartY;
              
              if (conn.from === 'panel-equipment-valve' && group.valve) {
                // 如果有主設備閥件，從 panel → valve 連接線上的位置出發
                const panelRightX = group.panel.position.x + CARD_WIDTH;
                const panelY = group.panel.position.y + CARD_HEIGHT_OFFSET;
                const valveLeftX = group.valve.position.x;
                const midX = panelRightX + (valveLeftX - panelRightX) * 0.9;
                const iconX = panelRightX + (midX - panelRightX) * 0.33;
                const purpleIconX = panelRightX + (valveLeftX - panelRightX) * 0.67;
                fromPosX = (iconX + purpleIconX) / 2;
                fromPosY = panelY;
              }
              
              conn.fromPosition = { x: fromPosX, y: fromPosY };
              conn.toPosition = { x: card.position.x, y: card.position.y + CARD_HEIGHT_OFFSET };
            }
          }
          
          // 處理額外設備卡片上的閥件連接線（panel/panel-equipment-valve → additional-equipment-valve）
          if ((conn.from === 'panel' || conn.from === 'panel-equipment-valve') &&
              conn.to === 'additional-equipment-valve' &&
              conn.groupIndex === groupIndex &&
              conn.equipmentCardIndex !== undefined) {
            const equipmentCardIndex = conn.equipmentCardIndex;
            if (equipmentCardIndex !== undefined && group.additionalEquipmentCards && 
                equipmentCardIndex < group.additionalEquipmentCards.length &&
                group.additionalEquipmentCards[equipmentCardIndex] &&
                group.additionalEquipmentCards[equipmentCardIndex].valve) {
              const valve = group.additionalEquipmentCards[equipmentCardIndex].valve;
              
              // 重新計算連接線起始位置
              let fromPosX = connectionStartX;
              let fromPosY = connectionStartY;
              
              if (conn.from === 'panel-equipment-valve' && group.valve) {
                // 如果有主設備閥件，從 panel → valve 連接線上的位置出發
                const panelRightX = group.panel.position.x + CARD_WIDTH;
                const panelY = group.panel.position.y + CARD_HEIGHT_OFFSET;
                const valveLeftX = group.valve.position.x;
                const midX = panelRightX + (valveLeftX - panelRightX) * 0.9;
                const iconX = panelRightX + (midX - panelRightX) * 0.33;
                const purpleIconX = panelRightX + (valveLeftX - panelRightX) * 0.67;
                fromPosX = (iconX + purpleIconX) / 2;
                fromPosY = panelY;
              }
              
              conn.fromPosition = { x: fromPosX, y: fromPosY };
              conn.toPosition = { 
                x: valve.position.x, 
                y: valve.position.y + CARD_HEIGHT_OFFSET 
              };
            }
          }
          
          // 處理額外設備卡片閥件 → 設備卡片的連接線
          if (conn.from === 'additional-equipment-valve' &&
              conn.to === 'additional-equipment' &&
              conn.groupIndex === groupIndex &&
              conn.equipmentCardIndex !== undefined) {
            const equipmentCardIndex = conn.equipmentCardIndex;
            if (equipmentCardIndex !== undefined && group.additionalEquipmentCards && 
                equipmentCardIndex < group.additionalEquipmentCards.length &&
                group.additionalEquipmentCards[equipmentCardIndex]) {
              const card = group.additionalEquipmentCards[equipmentCardIndex];
              
              if (card.valve) {
                conn.fromPosition = { 
                  x: card.valve.position.x + CARD_WIDTH, 
                  y: card.valve.position.y + CARD_HEIGHT_OFFSET 
                };
                conn.toPosition = { 
                  x: card.position.x, 
                  y: card.position.y + CARD_HEIGHT_OFFSET 
                };
              }
            }
          }
        }
      });
      
      if (isBranch) {
        console.log(`分支 ${branchModuleIndex} 群組 ${groupIndex} 找到並更新了 ${foundConnections} 條連接線`);
        if (foundConnections === 0 && group.additionalEquipmentCards && group.additionalEquipmentCards.length > 0) {
          console.warn(`警告: 群組 ${groupIndex} 有 ${group.additionalEquipmentCards.length} 個設備卡片，但沒有找到對應的連接線！`);
        }
      }
    },
    
    /**
     * 創建分支模組的後續卡片
     * @param {Object} branchValveCard - 分支閥件卡片對象
     * @returns {Object} 包含所有後續卡片的對象
     */
    createBranchModuleCards(branchValveCard) {
      // 調整分支模組的卡片間距
      const valveToPipelineSpacing = 260;  // 分支資訊到管線資訊的間距（縮短）
      const pipelineToFloorSpacing = 260;  // 790 - 520 = 270px
      const floorToPanelSpacing = 330;     // 1120 - 790 = 330px
      const panelToEquipmentSpacing = 430; // 1550 - 1120 = 430px
      
      // 計算各卡片的位置（所有卡片使用相同的Y位置）
      const pipelineX = branchValveCard.position.x + valveToPipelineSpacing;
      const floorX = pipelineX + pipelineToFloorSpacing;
      const panelX = floorX + floorToPanelSpacing;
      const equipmentX = panelX + panelToEquipmentSpacing;
      
      return {
        valve: {
          id: `branch-valve-card-${Date.now()}`,
          type: 'branch-valve',
          position: { x: branchValveCard.position.x, y: branchValveCard.position.y },
          data: {
            connectorType: '',
            size: '',
            valveType: '',
            enableValve: false,
            branchSize: ''
          }
        },
        pipeline: {
          id: `branch-pipeline-card-${Date.now()}`,
          type: 'branch-pipeline',
          position: { x: pipelineX, y: branchValveCard.position.y },
          data: {
            length: '',
            material: 'NA'
          }
        },
        floor: {
          id: `branch-floor-card-${Date.now()}`,
          type: 'branch-floor',
          position: { x: floorX, y: branchValveCard.position.y },
          data: {
            sourceFloor: '',
            equipmentFloor: ''
          }
        },
        // 使用 panelEquipmentGroups 數組來支持多個面板群組
        panelEquipmentGroups: [
          {
            id: `branch-panel-equipment-group-${Date.now()}`,
            panel: {
              id: `branch-panel-card-${Date.now()}`,
              type: 'branch-panel',
              position: { x: panelX, y: branchValveCard.position.y },
              data: {
                enablePanel: true,
                valve: '',
                size: '',
                valveConnector: '',
                regulator: false,
                pressureGauge: 'none',
                backPipelineType: ''
              }
            },
            equipment: {
              id: `branch-equipment-card-${Date.now()}`,
              type: 'branch-equipment',
              position: { x: equipmentX, y: branchValveCard.position.y },
              data: {
                gasType: '',
                size: '',
                connector: '',
                connectionName: '',
                threeInOne: ''
              }
            },
            additionalEquipmentCards: []
          }
        ]
      };
    },
    
    /**
     * 添加分支模組的後續卡片到模組組
     * @param {Object} moduleSet - 模組組對象
     * @param {Object} branchModuleCards - 分支模組卡片對象
     */
    addBranchModuleCards(moduleSet, branchModuleCards) {
      // 初始化分支模組卡片數組
      if (!moduleSet.branchModuleCards) {
        moduleSet.branchModuleCards = [];
      }
      
      // 添加分支模組卡片
      moduleSet.branchModuleCards.push(branchModuleCards);
      
      console.log('已添加分支模組卡片:', branchModuleCards);
    },
    
    /**
     * 添加分支模組內部的連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {Object} branchModuleCards - 分支模組卡片對象
     * @param {number} moduleSetIndex - 模組組索引
     */
    addBranchModuleConnections(moduleSet, branchModuleCards, moduleSetIndex) {
      const branchModuleIndex = moduleSet.branchModuleCards.length - 1;
      
      // 分支閥件 → 管線資訊
      const valveToPipelineConnection = {
        from: 'branch-valve',
        to: 'branch-pipeline',
        showAdditionalIcon: false,
        showFaIcon: false,
        branchValveCardIndex: moduleSet.valveCards.length - 1,
        branchModuleIndex: branchModuleIndex,
        moduleSetIndex: moduleSetIndex
      };
      
      // 管線資訊 → 樓層資訊
      const pipelineToFloorConnection = {
        from: 'branch-pipeline',
        to: 'branch-floor',
        showAdditionalIcon: false,
        showFaIcon: false,
        branchModuleIndex: branchModuleIndex,
        moduleSetIndex: moduleSetIndex
      };
      
      // 樓層資訊 → 盤面
      const floorToPanelConnection = {
        from: 'branch-floor',
        to: 'branch-panel',
        showAdditionalIcon: true,
        showFaIcon: false,
        branchModuleIndex: branchModuleIndex,
        moduleSetIndex: moduleSetIndex,
        panelEquipmentGroupIndex: 0 // 初始群組索引
      };
      
      // 盤面 → 設備資訊
      const panelToEquipmentConnection = {
        from: 'branch-panel',
        to: 'branch-equipment',
        showAdditionalIcon: true,
        showFaIcon: true,
        branchModuleIndex: branchModuleIndex,
        moduleSetIndex: moduleSetIndex,
        panelEquipmentGroupIndex: 0 // 初始群組索引
      };
      
      // 添加所有連接線
      moduleSet.connections.push(
        valveToPipelineConnection,
        pipelineToFloorConnection,
        floorToPanelConnection,
        panelToEquipmentConnection
      );
      
      console.log('已添加分支模組內部連接線:', {
        valveToPipeline: valveToPipelineConnection,
        pipelineToFloor: pipelineToFloorConnection,
        floorToPanel: floorToPanelConnection
      });
    },
    
    /**
     * 添加分支閥件的連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {Object} branchValveCard - 分支閥件卡片對象
     * @param {number} moduleSetIndex - 模組組索引
     */
    addBranchValveConnection(moduleSet, branchValveCard, moduleSetIndex) {
      console.log('添加分支閥件連接線');
      
      // 找到最後一個閥件卡片（源閥件）
      const lastValveCard = moduleSet.valveCards[moduleSet.valveCards.length - 2]; // 倒數第二個（新添加的分支閥件之前）
      
      // 計算連接線位置
      // 起點：源頭資訊到閥件資訊的連接線上（紫色圖標位置）
      const fromX = moduleSet.source.position.x + CARD_WIDTH + 140; // 源頭資訊卡片右側 + 紫色圖標偏移
      const fromY = moduleSet.source.position.y + CARD_HEIGHT_OFFSET;
      
      // 終點：分支閥件卡片的左側
      const toX = branchValveCard.position.x;
      const toY = branchValveCard.position.y + CARD_HEIGHT_OFFSET;
      
      const branchValveConnection = {
        from: 'source',
        to: 'branch-valve',
        showAdditionalIcon: false,
        showFaIcon: false,
        valveCardIndex: moduleSet.valveCards.length - 2, // 源閥件索引
        branchValveCardIndex: moduleSet.valveCards.length - 1, // 分支閥件索引（新添加的）
        branchModuleIndex: moduleSet.branchModuleCards.length, // 對應的分支模組索引（即將添加）
        moduleSetIndex: moduleSetIndex,
        fromPosition: { x: fromX, y: fromY },
        toPosition: { x: toX, y: toY }
      };
      
      moduleSet.connections.push(branchValveConnection);
      console.log('已添加分支閥件連接線:', branchValveConnection);
    },
    
    /**
     * 處理刪除閥件事件
     * @param {Object} valveData - 閥件數據
     */
    handleDeleteValve(valveData) {
      console.log('刪除閥件:', valveData);
      
      // 檢查是否為 Panel-Equipment 之間的閥件
      if (valveData.type === 'panel-equipment-valve') {
        // 查找對應的模組組和群組索引
        for (let moduleSetIndex = 0; moduleSetIndex < this.allModuleSets.length; moduleSetIndex++) {
          const currentModuleSet = this.allModuleSets[moduleSetIndex];
          if (currentModuleSet?.panelEquipmentGroups?.length > 0) {
            for (let groupIndex = 0; groupIndex < currentModuleSet.panelEquipmentGroups.length; groupIndex++) {
              const group = currentModuleSet.panelEquipmentGroups[groupIndex];
              if (group.valve && 
                  group.valve.position.x === valveData.position.x && 
                  group.valve.position.y === valveData.position.y) {
                this.showConfirmPopup('是否確定刪除此閥件?', () => {
                  this.deletePanelEquipmentValve(moduleSetIndex, groupIndex);
                  this.closePopup();
                }, () => {
                  this.closePopup();
                });
                return;
              }
            }
          }
        }
        console.error('找不到要刪除的 Panel-Equipment 閥件');
        return;
      }
      
      this.showConfirmPopup('是否確定刪除此閥件?', () => {
        this.deleteValveInfoCard(valveData);
        this.closePopup();
      }, () => {
        this.closePopup();
      });
    },
    
    /**
     * 處理刪除 Panel-Equipment 之間的閥件事件
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} groupIndex - 群組索引
     * @param {Object} valveData - 閥件數據
     */
    handleDeletePanelEquipmentValve(moduleSetIndex, groupIndex, valveData) {
      console.log('刪除 Panel-Equipment 閥件:', { moduleSetIndex, groupIndex });
      
      this.showConfirmPopup('是否確定刪除此閥件?', () => {
        this.deletePanelEquipmentValve(moduleSetIndex, groupIndex);
        this.closePopup();
      }, () => {
        this.closePopup();
      });
    },
    
    /**
     * 處理刪除額外設備卡片閥件事件
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} groupIndex - 群組索引
     * @param {number} cardIndex - 設備卡片索引
     * @param {Object} valveData - 閥件數據
     */
    handleDeleteAdditionalEquipmentValve(moduleSetIndex, groupIndex, cardIndex, valveData) {
      console.log('刪除額外設備卡片閥件:', { moduleSetIndex, groupIndex, cardIndex });
      
      this.showConfirmPopup('是否確定刪除此閥件?', () => {
        this.deleteAdditionalEquipmentValve(moduleSetIndex, groupIndex, cardIndex);
        this.closePopup();
      }, () => {
        this.closePopup();
      });
    },
    
    /**
     * 處理刪除分支額外設備卡片閥件事件
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     * @param {number} cardIndex - 設備卡片索引
     * @param {Object} valveData - 閥件數據
     */
    handleDeleteBranchAdditionalEquipmentValve(moduleSetIndex, branchModuleIndex, groupIndex, cardIndex, valveData) {
      console.log('刪除分支額外設備卡片閥件:', { moduleSetIndex, branchModuleIndex, groupIndex, cardIndex });
      
      this.showConfirmPopup('是否確定刪除此閥件?', () => {
        this.deleteBranchAdditionalEquipmentValve(moduleSetIndex, branchModuleIndex, groupIndex, cardIndex);
        this.closePopup();
      }, () => {
        this.closePopup();
      });
    },
    
    /**
     * 刪除 Panel-Equipment 之間的閥件
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} groupIndex - 群組索引
     */
    deletePanelEquipmentValve(moduleSetIndex, groupIndex) {
      console.log('刪除 Panel-Equipment 閥件:', { moduleSetIndex, groupIndex });
      
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      const panelEquipmentGroup = currentModuleSet.panelEquipmentGroups[groupIndex];
      
      if (!panelEquipmentGroup || !panelEquipmentGroup.valve) {
        console.error('找不到要刪除的閥件');
        return;
      }
      
      const valve = panelEquipmentGroup.valve;
      const shiftDistance = 318; // 閥件寬度232 + 間距86
      
      // 在刪除連接線之前，先保存 panel → valve 連接的設置（用於恢復 panel → equipment 連接）
      const panelToValveConnection = currentModuleSet.connections.find(conn => 
        conn.from === 'panel' && conn.to === 'panel-equipment-valve' && conn.groupIndex === groupIndex
      );
      
      // 刪除相關連接線
      this.removePanelEquipmentValveConnections(currentModuleSet, groupIndex);
      
      // 刪除閥件對象
      delete panelEquipmentGroup.valve;
      
      // 恢復 equipment 位置（向左移動）
      panelEquipmentGroup.equipment.position.x -= shiftDistance;
      
      // 如果有額外的設備卡片，也向左移動回來
      if (panelEquipmentGroup.additionalEquipmentCards) {
        panelEquipmentGroup.additionalEquipmentCards.forEach(card => {
          card.position.x -= shiftDistance;
        });
      }
      
      // 恢復連接線配置（panel → equipment 直接連接）
      this.restoreConnectionsForPanelEquipment(currentModuleSet, groupIndex, panelToValveConnection);
      
      // 恢復設備卡片的連接線（從 panel-equipment-valve 改回 panel-equipment-connection）
      this.restoreAdditionalEquipmentConnectionLines(currentModuleSet, groupIndex, shiftDistance);
      
      // 更新所有分支閥件的位置
      this.updateAllBranchValvePositions(currentModuleSet);
      
      // 更新設備卡片的連接線位置
      this.updateAdditionalEquipmentConnectionLines(currentModuleSet, -1);
      
      // 更新所有模組組的位置（因為該模組組高度可能改變）
      this.updateAllModuleSetPositions();
      
      console.log(`已刪除 Panel-Equipment 閥件（群組 ${groupIndex}）`);
    },
    
    /**
     * 刪除額外設備卡片閥件
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} groupIndex - 群組索引
     * @param {number} cardIndex - 設備卡片索引
     */
    deleteAdditionalEquipmentValve(moduleSetIndex, groupIndex, cardIndex) {
      console.log('刪除額外設備卡片閥件:', { moduleSetIndex, groupIndex, cardIndex });
      
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      const panelEquipmentGroup = currentModuleSet.panelEquipmentGroups[groupIndex];
      
      if (!panelEquipmentGroup || !panelEquipmentGroup.additionalEquipmentCards ||
          cardIndex >= panelEquipmentGroup.additionalEquipmentCards.length) {
        console.error('找不到要刪除的設備卡片');
        return;
      }
      
      const equipmentCard = panelEquipmentGroup.additionalEquipmentCards[cardIndex];
      
      if (!equipmentCard.valve) {
        console.error('找不到要刪除的閥件');
        return;
      }
      
      const shiftDistance = 318; // 閥件寬度232 + 間距86
      
      // 在刪除連接線之前，先保存原連接的設置（用於恢復連接）
      const oldConnection = currentModuleSet.connections.find(conn => 
        (conn.from === 'panel' || conn.from === 'panel-equipment-valve') &&
        conn.to === 'additional-equipment-valve' &&
        conn.groupIndex === groupIndex &&
        conn.equipmentCardIndex === cardIndex
      );
      
      // 刪除相關連接線
      this.removeAdditionalEquipmentValveConnections(currentModuleSet, groupIndex, cardIndex);
      
      // 刪除閥件對象
      delete equipmentCard.valve;
      
      // 恢復設備卡片位置（向左移動）
      equipmentCard.position.x -= shiftDistance;
      
      // 如果有該設備卡片之後的其他設備卡片，也向左移動回來
      if (panelEquipmentGroup.additionalEquipmentCards) {
        for (let i = cardIndex + 1; i < panelEquipmentGroup.additionalEquipmentCards.length; i++) {
          panelEquipmentGroup.additionalEquipmentCards[i].position.x -= shiftDistance;
        }
      }
      
      // 恢復連接線配置（直接從 panel 或 panel-equipment-valve 連接到設備卡片）
      this.restoreConnectionsForAdditionalEquipment(currentModuleSet, groupIndex, cardIndex, oldConnection);
      
      // 更新其他額外設備卡片的連接線位置（因為後續卡片左移了）
      this.updateOtherAdditionalEquipmentConnectionLinesAfterDelete(currentModuleSet, groupIndex, cardIndex);
      
      // 更新所有模組組的位置（因為該模組組高度可能改變）
      this.updateAllModuleSetPositions();
      
      console.log(`已刪除額外設備卡片閥件（群組 ${groupIndex}，卡片 ${cardIndex}）`);
    },
    
    /**
     * 刪除額外設備卡片閥件相關的連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - 群組索引
     * @param {number} equipmentCardIndex - 設備卡片索引
     */
    removeAdditionalEquipmentValveConnections(moduleSet, groupIndex, equipmentCardIndex) {
      moduleSet.connections = moduleSet.connections.filter(conn => {
        // 刪除 panel/panel-equipment-valve → additional-equipment-valve 連接線
        if ((conn.from === 'panel' || conn.from === 'panel-equipment-valve') &&
            conn.to === 'additional-equipment-valve' &&
            conn.groupIndex === groupIndex &&
            conn.equipmentCardIndex === equipmentCardIndex) {
          return false;
        }
        // 刪除 additional-equipment-valve → additional-equipment 連接線
        if (conn.from === 'additional-equipment-valve' &&
            conn.to === 'additional-equipment' &&
            conn.groupIndex === groupIndex &&
            conn.equipmentCardIndex === equipmentCardIndex) {
          return false;
        }
        return true;
      });
    },
    
    /**
     * 恢復額外設備卡片的連接線配置（刪除閥件後，恢復為直接連接）
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - 群組索引
     * @param {number} equipmentCardIndex - 設備卡片索引
     * @param {Object} oldConnection - 舊的連接線（用於獲取設置）
     */
    restoreConnectionsForAdditionalEquipment(moduleSet, groupIndex, equipmentCardIndex, oldConnection) {
      const panelEquipmentGroup = moduleSet.panelEquipmentGroups[groupIndex];
      const equipmentCard = panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex];
      
      // 確定起始點：根據主設備是否有閥件決定
      let connectionFrom = 'panel-equipment-connection';
      if (panelEquipmentGroup.valve) {
        connectionFrom = 'panel-equipment-valve';
      }
      
      // 計算連接線起始位置
      const panelRightX = panelEquipmentGroup.panel.position.x + CARD_WIDTH;
      const panelY = panelEquipmentGroup.panel.position.y + CARD_HEIGHT_OFFSET;
      
      let fromPosition;
      if (connectionFrom === 'panel-equipment-valve' && panelEquipmentGroup.valve) {
        // 從主閥件連接到額外設備卡片
        const valveLeftX = panelEquipmentGroup.valve.position.x;
        const midX = panelRightX + (valveLeftX - panelRightX) * 0.9;
        const iconX = panelRightX + (midX - panelRightX) * 0.33;
        const purpleIconX = panelRightX + (valveLeftX - panelRightX) * 0.67;
        const connectionStartX = (iconX + purpleIconX) / 2;
        fromPosition = { x: connectionStartX, y: panelY };
      } else {
        // 從 panel 和 equipment 之間連接到額外設備卡片
        const equipmentLeftX = panelEquipmentGroup.equipment.position.x;
        const midX = panelRightX + (equipmentLeftX - panelRightX) * 0.9;
        const iconX = panelRightX + (midX - panelRightX) * 0.33;
        const purpleIconX = panelRightX + (equipmentLeftX - panelRightX) * 0.67;
        const connectionStartX = (iconX + purpleIconX) / 2;
        fromPosition = { x: connectionStartX, y: panelY };
      }
      
      // 添加恢復後的連接線
      moduleSet.connections.push({
        from: connectionFrom,
        to: 'additional-equipment',
        showAdditionalIcon: false,
        showFaIcon: true,
        groupIndex: groupIndex,
        equipmentCardIndex: equipmentCardIndex,
        fromPosition: fromPosition,
        toPosition: {
          x: equipmentCard.position.x,
          y: equipmentCard.position.y + CARD_HEIGHT_OFFSET
        }
      });
    },
    
    /**
     * 刪除分支額外設備卡片閥件
     * @param {number} moduleSetIndex - 模組組索引
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     * @param {number} cardIndex - 設備卡片索引
     */
    deleteBranchAdditionalEquipmentValve(moduleSetIndex, branchModuleIndex, groupIndex, cardIndex) {
      console.log('刪除分支額外設備卡片閥件:', { moduleSetIndex, branchModuleIndex, groupIndex, cardIndex });
      
      const currentModuleSet = this.allModuleSets[moduleSetIndex];
      
      if (!currentModuleSet || !currentModuleSet.branchModuleCards || 
          branchModuleIndex >= currentModuleSet.branchModuleCards.length) {
        console.error('找不到要刪除的分支模組');
        return;
      }
      
      const branchModule = currentModuleSet.branchModuleCards[branchModuleIndex];
      const panelEquipmentGroup = branchModule.panelEquipmentGroups[groupIndex];
      
      if (!panelEquipmentGroup || !panelEquipmentGroup.additionalEquipmentCards ||
          cardIndex >= panelEquipmentGroup.additionalEquipmentCards.length) {
        console.error('找不到要刪除的設備卡片');
        return;
      }
      
      const equipmentCard = panelEquipmentGroup.additionalEquipmentCards[cardIndex];
      
      if (!equipmentCard.valve) {
        console.error('找不到要刪除的閥件');
        return;
      }
      
      const shiftDistance = 318; // 閥件寬度232 + 間距86
      
      // 在刪除連接線之前，先保存原連接的設置（用於恢復連接）
      const oldConnection = currentModuleSet.connections.find(conn => 
        conn.from === 'branch-panel-equipment-connection' &&
        conn.to === 'branch-additional-equipment-valve' &&
        conn.branchModuleIndex === branchModuleIndex &&
        conn.panelEquipmentGroupIndex === groupIndex &&
        conn.equipmentCardIndex === cardIndex
      );
      
      // 刪除相關連接線
      this.removeBranchAdditionalEquipmentValveConnections(currentModuleSet, branchModuleIndex, groupIndex, cardIndex);
      
      // 刪除閥件對象
      delete equipmentCard.valve;
      
      // 恢復設備卡片位置（向左移動）
      equipmentCard.position.x -= shiftDistance;
      
      // 如果有該設備卡片之後的其他設備卡片（同一分支），也向左移動回來
      if (panelEquipmentGroup.additionalEquipmentCards) {
        for (let i = cardIndex + 1; i < panelEquipmentGroup.additionalEquipmentCards.length; i++) {
          panelEquipmentGroup.additionalEquipmentCards[i].position.x -= shiftDistance;
        }
      }
      
      // 恢復連接線配置（直接從 panel 連接到設備卡片）
      this.restoreConnectionsForBranchAdditionalEquipment(currentModuleSet, branchModuleIndex, groupIndex, cardIndex, oldConnection);
      
      // 更新其他分支額外設備卡片的連接線位置（因為後續卡片左移了）
      this.updateOtherBranchAdditionalEquipmentConnectionLinesAfterDelete(currentModuleSet, branchModuleIndex, groupIndex, cardIndex);
      
      // 只更新該分支的設備卡片連接線，不更新所有模組組位置（避免影響其他分支設備卡片）
      this.updateAdditionalEquipmentConnectionLines(currentModuleSet, branchModuleIndex);
      
      console.log(`已刪除分支額外設備卡片閥件（分支 ${branchModuleIndex}，群組 ${groupIndex}，卡片 ${cardIndex}）`);
    },
    
    /**
     * 刪除分支額外設備卡片閥件相關的連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     * @param {number} equipmentCardIndex - 設備卡片索引
     */
    removeBranchAdditionalEquipmentValveConnections(moduleSet, branchModuleIndex, groupIndex, equipmentCardIndex) {
      moduleSet.connections = moduleSet.connections.filter(conn => {
        // 刪除 branch-panel-equipment-connection → branch-additional-equipment-valve 連接線
        if (conn.from === 'branch-panel-equipment-connection' &&
            conn.to === 'branch-additional-equipment-valve' &&
            conn.branchModuleIndex === branchModuleIndex &&
            conn.panelEquipmentGroupIndex === groupIndex &&
            conn.equipmentCardIndex === equipmentCardIndex) {
          return false;
        }
        // 刪除 branch-additional-equipment-valve → branch-additional-equipment 連接線
        if (conn.from === 'branch-additional-equipment-valve' &&
            conn.to === 'branch-additional-equipment' &&
            conn.branchModuleIndex === branchModuleIndex &&
            conn.panelEquipmentGroupIndex === groupIndex &&
            conn.equipmentCardIndex === equipmentCardIndex) {
          return false;
        }
        return true;
      });
    },
    
    /**
     * 恢復分支額外設備卡片的連接線配置（刪除閥件後，恢復為直接連接）
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - 群組索引
     * @param {number} equipmentCardIndex - 設備卡片索引
     * @param {Object} oldConnection - 舊的連接線（用於獲取設置）
     */
    restoreConnectionsForBranchAdditionalEquipment(moduleSet, branchModuleIndex, groupIndex, equipmentCardIndex, oldConnection) {
      const branchModule = moduleSet.branchModuleCards[branchModuleIndex];
      const panelEquipmentGroup = branchModule.panelEquipmentGroups[groupIndex];
      const equipmentCard = panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex];
      
      // 計算連接線起始位置
      const panelRightX = panelEquipmentGroup.panel.position.x + CARD_WIDTH;
      const panelY = panelEquipmentGroup.panel.position.y + CARD_HEIGHT_OFFSET;
      const equipmentLeftX = panelEquipmentGroup.equipment.position.x;
      
      const midX = panelRightX + (equipmentLeftX - panelRightX) * 0.9;
      const iconX = panelRightX + (midX - panelRightX) * 0.33;
      const purpleIconX = panelRightX + (equipmentLeftX - panelRightX) * 0.67;
      const connectionStartX = (iconX + purpleIconX) / 2;
      
      // 添加恢復後的連接線
      moduleSet.connections.push({
        from: 'branch-panel-equipment-connection',
        to: 'branch-additional-equipment',
        showAdditionalIcon: false,
        showFaIcon: true,
        branchModuleIndex: branchModuleIndex,
        panelEquipmentGroupIndex: groupIndex,
        equipmentCardIndex: equipmentCardIndex,
        fromPosition: { x: connectionStartX, y: panelY },
        toPosition: {
          x: equipmentCard.position.x,
          y: equipmentCard.position.y + CARD_HEIGHT_OFFSET
        }
      });
    },
    
    /**
     * 更新其他分支額外設備卡片的連接線位置（刪除閥件後，後續設備卡片左移，需要更新它們的連接線）
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchModuleIndex - 分支模組索引
     * @param {number} groupIndex - Panel+Equipment 群組索引
     * @param {number} deletedCardIndex - 被刪除閥件的設備卡片索引
     */
    updateOtherBranchAdditionalEquipmentConnectionLinesAfterDelete(moduleSet, branchModuleIndex, groupIndex, deletedCardIndex) {
      const branchModule = moduleSet.branchModuleCards[branchModuleIndex];
      const panelEquipmentGroup = branchModule.panelEquipmentGroups[groupIndex];
      const shiftDistance = 318; // 閥件寬度232 + 間距86
      
      // 更新後續設備卡片的連接線終點位置（只更新該分支的）
      moduleSet.connections.forEach(conn => {
        if ((conn.from === 'branch-panel-equipment-connection' || conn.from === 'branch-additional-equipment-valve') &&
            conn.to === 'branch-additional-equipment' &&
            conn.branchModuleIndex === branchModuleIndex &&
            conn.panelEquipmentGroupIndex === groupIndex &&
            conn.equipmentCardIndex !== undefined &&
            conn.equipmentCardIndex > deletedCardIndex) {
          
          // 更新連接線結束位置（設備已經左移了shiftDistance）
          if (conn.toPosition) {
            conn.toPosition.x -= shiftDistance;
          } else {
            // 如果沒有 toPosition，從設備卡片位置計算
            const equipmentCardIndex = conn.equipmentCardIndex;
            if (equipmentCardIndex !== undefined && panelEquipmentGroup.additionalEquipmentCards && 
                panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex]) {
              const equipmentCard = panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex];
              conn.toPosition = {
                x: equipmentCard.position.x,
                y: equipmentCard.position.y + CARD_HEIGHT_OFFSET
              };
            }
          }
        }
      });
    },
    
    /**
     * 更新其他額外設備卡片的連接線位置（刪除閥件後，後續設備卡片左移，需要更新它們的連接線）
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - Panel+Equipment 群組索引
     * @param {number} deletedCardIndex - 被刪除閥件的設備卡片索引
     */
    updateOtherAdditionalEquipmentConnectionLinesAfterDelete(moduleSet, groupIndex, deletedCardIndex) {
      const panelEquipmentGroup = moduleSet.panelEquipmentGroups[groupIndex];
      const shiftDistance = 318; // 閥件寬度232 + 間距86
      
      // 更新後續設備卡片的連接線終點位置
      moduleSet.connections.forEach(conn => {
        if ((conn.from === 'panel-equipment-connection' || conn.from === 'panel-equipment-valve' || 
             conn.from === 'additional-equipment-valve') &&
            conn.to === 'additional-equipment' &&
            conn.groupIndex === groupIndex &&
            conn.equipmentCardIndex !== undefined &&
            conn.equipmentCardIndex > deletedCardIndex) {
          
          // 更新連接線結束位置（設備已經左移了shiftDistance）
          if (conn.toPosition) {
            conn.toPosition.x -= shiftDistance;
          } else {
            // 如果沒有 toPosition，從設備卡片位置計算
            const equipmentCardIndex = conn.equipmentCardIndex;
            if (equipmentCardIndex !== undefined && panelEquipmentGroup.additionalEquipmentCards && 
                panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex]) {
              const equipmentCard = panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex];
              conn.toPosition = {
                x: equipmentCard.position.x,
                y: equipmentCard.position.y + CARD_HEIGHT_OFFSET
              };
            }
          }
        }
      });
    },
    
    /**
     * 刪除 Panel-Equipment 閥件相關的連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - 群組索引
     */
    removePanelEquipmentValveConnections(moduleSet, groupIndex) {
      moduleSet.connections = moduleSet.connections.filter(conn => {
        // 刪除 panel → panel-equipment-valve 連接線
        if (conn.from === 'panel' && conn.to === 'panel-equipment-valve' && conn.groupIndex === groupIndex) {
          return false;
        }
        // 刪除 panel-equipment-valve → equipment 連接線
        if (conn.from === 'panel-equipment-valve' && conn.to === 'equipment' && conn.groupIndex === groupIndex) {
          return false;
        }
        return true;
      });
    },
    
    /**
     * 恢復 Panel-Equipment 之間的直接連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - 群組索引
     * @param {Object} oldValveConnection - 舊的 panel → valve 連接線（用於獲取設置）
     */
    restoreConnectionsForPanelEquipment(moduleSet, groupIndex, oldValveConnection) {
      // 檢查是否已經有 panel → equipment 的連接（應該沒有）
      const existingConnection = moduleSet.connections.find(conn => 
        conn.from === 'panel' && conn.to === 'equipment' && conn.groupIndex === groupIndex
      );
      
      if (!existingConnection) {
        // 添加 panel → equipment 直接連接（保留原有的 showAdditionalIcon 和 showFaIcon 設置）
        moduleSet.connections.push({
          from: 'panel',
          to: 'equipment',
          groupIndex: groupIndex,
          showAdditionalIcon: oldValveConnection?.showAdditionalIcon ?? true,
          showFaIcon: oldValveConnection?.showFaIcon ?? true
        });
      }
    },
    
    /**
     * 恢復額外設備卡片的連接線（從 panel-equipment-valve 改回 panel-equipment-connection）
     * @param {Object} moduleSet - 模組組對象
     * @param {number} groupIndex - 群組索引
     * @param {number} shiftDistance - 移動距離（負值表示向左移動）
     */
    restoreAdditionalEquipmentConnectionLines(moduleSet, groupIndex, shiftDistance) {
      const panelEquipmentGroup = moduleSet.panelEquipmentGroups[groupIndex];
      
      if (!panelEquipmentGroup || !panelEquipmentGroup.additionalEquipmentCards) {
        return;
      }
      
      // 更新設備卡片的連接線
      moduleSet.connections.forEach(conn => {
        if (conn.from === 'panel-equipment-valve' && 
            conn.groupIndex === groupIndex && 
            conn.equipmentCardIndex !== undefined) {
          
          // 改回 panel-equipment-connection
          conn.from = 'panel-equipment-connection';
          
          // 重新計算連接線起始位置（panel 和 equipment 之間）
          const panelRightX = panelEquipmentGroup.panel.position.x + CARD_WIDTH;
          const panelY = panelEquipmentGroup.panel.position.y + CARD_HEIGHT_OFFSET;
          const equipmentLeftX = panelEquipmentGroup.equipment.position.x;
          
          // 計算 add icon 的位置（panel 和 equipment 之間）
          const midX = panelRightX + (equipmentLeftX - panelRightX) * 0.9;
          const iconX = panelRightX + (midX - panelRightX) * 0.33;
          
          // 計算紫色圖標的位置
          const purpleIconX = panelRightX + (equipmentLeftX - panelRightX) * 0.67;
          
          // 連接線從 add icon 和 purple icon 之間的位置開始
          const connectionStartX = (iconX + purpleIconX) / 2;
          
          conn.fromPosition = {
            x: connectionStartX,
            y: panelY
          };
          
          // 更新連接線結束位置（基於設備卡片的新位置，已經左移了）
          const equipmentCardIndex = conn.equipmentCardIndex;
          if (equipmentCardIndex !== undefined && panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex]) {
            const equipmentCard = panelEquipmentGroup.additionalEquipmentCards[equipmentCardIndex];
            conn.toPosition = {
              x: equipmentCard.position.x,
              y: equipmentCard.position.y + CARD_HEIGHT_OFFSET
            };
          }
        }
      });
    },
    
    /**
     * 刪除閥件資訊卡片
     * @param {Object} valveData - 閥件數據
     */
    deleteValveInfoCard(valveData) {
      console.log('刪除閥件資訊卡片');
      
      // 遍歷所有模組組，找到包含要刪除閥件的模組
      for (let moduleSetIndex = 0; moduleSetIndex < this.allModuleSets.length; moduleSetIndex++) {
        const currentModuleSet = this.allModuleSets[moduleSetIndex];
        
        if (currentModuleSet?.valveCards?.length > 0) {
          const valveIndex = currentModuleSet.valveCards.findIndex(valveCard => 
            valveCard.position.x === valveData.position.x && 
            valveCard.position.y === valveData.position.y
          );
          
          if (valveIndex !== -1) {
            // 刪除閥件卡片
            currentModuleSet.valveCards.splice(valveIndex, 1);
            
            // 復原卡片位置和連接線配置
            this.restoreCardsPosition(currentModuleSet);
            this.restoreConnectionsForValve(currentModuleSet);
            this.updateExistingPanelConnections(currentModuleSet);
            
            // 更新設備卡片的連接線位置
            this.updateAdditionalEquipmentConnectionLines(currentModuleSet, -1);
            
            // 更新所有模組組的位置（因為該模組組高度可能改變）
            this.updateAllModuleSetPositions();
            
            console.log(`已從模組組 ${moduleSetIndex} 中刪除閥件資訊卡片並復原佈局`);
            return;
          }
        }
      }
      
      console.error('找不到要刪除的閥件卡片');
    },
    // ==================== 分支閥件管理 ====================
    /**
     * 處理刪除分支閥件事件
     * @param {Object} valveData - 閥件數據
     */
    handleDeleteBranchValve(valveData) {
      console.log('刪除分支閥件:', valveData);
      
      this.showConfirmPopup('是否確定刪除此分支閥件及其相關元件?', () => {
        this.deleteBranchValveModule(valveData);
        this.closePopup();
      }, () => {
        this.closePopup();
      });
    },
    
    /**
     * 刪除分支閥件模組
     * @param {Object} valveData - 閥件數據
     */
    deleteBranchValveModule(valveData) {
      console.log('刪除分支閥件模組');
      
      // 遍歷所有模組組，找到包含要刪除分支閥件的模組
      for (let moduleSetIndex = 0; moduleSetIndex < this.allModuleSets.length; moduleSetIndex++) {
        const currentModuleSet = this.allModuleSets[moduleSetIndex];
        
        if (currentModuleSet?.branchModuleCards?.length > 0) {
          // 找到分支閥件模組的索引
          const branchModuleIndex = currentModuleSet.branchModuleCards.findIndex(branchModule => 
            branchModule.valve.position.x === valveData.position.x && 
            branchModule.valve.position.y === valveData.position.y
          );
          
          if (branchModuleIndex !== -1) {
            // 刪除分支模組卡片
            currentModuleSet.branchModuleCards.splice(branchModuleIndex, 1);
            
            // 如果valveCards中有對應的分支閥件，也刪除它
            if (currentModuleSet?.valveCards?.length > 0) {
              const branchValveIndex = currentModuleSet.valveCards.findIndex(valveCard => 
                valveCard.type === 'branch-valve' &&
                valveCard.position.x === valveData.position.x && 
                valveCard.position.y === valveData.position.y
              );
              
              if (branchValveIndex !== -1) {
                currentModuleSet.valveCards.splice(branchValveIndex, 1);
              }
            }
            
            // 刪除相關的連接線
            this.removeBranchValveConnections(currentModuleSet, branchModuleIndex);
            
            // 更新剩餘連接線的索引
            this.updateConnectionIndices(currentModuleSet, branchModuleIndex);
            
            // 更新所有模組組的位置（因為該模組組高度可能改變）
            this.updateAllModuleSetPositions();
            
            console.log(`已從模組組 ${moduleSetIndex} 中刪除分支閥件模組`);
            return;
          }
        }
      }
      
      console.error('找不到要刪除的分支閥件卡片');
    },
    
    /**
     * 刪除分支閥件相關的連接線
     * @param {Object} moduleSet - 模組組對象
     * @param {number} branchModuleIndex - 分支模組索引
     */
    removeBranchValveConnections(moduleSet, branchModuleIndex) {
      console.log('刪除分支閥件連接線');
      
      // 刪除分支閥件的連接線（從源頭到分支閥件）
      // 需要找到對應這個branchModuleIndex的連接線
      const connectionsToRemove = [];
      
      moduleSet.connections.forEach((conn, index) => {
        // 檢查是否是分支閥件連接線
        if (conn.from === 'source' && conn.to === 'branch-valve') {
          // 如果連接線的branchValveCardIndex對應這個branchModuleIndex
          // branchValveCardIndex是valveCards中的索引，需要轉換為branchModuleCards索引
          // 假設第一個閥件是普通閥件，之後都是分支閥件
          // branchValveCardIndex = 1 對應 branchModuleIndex = 0
          // branchValveCardIndex = 2 對應 branchModuleIndex = 1
          if (conn.branchValveCardIndex !== undefined) {
            const valveIndexInBranchModuleCards = conn.branchValveCardIndex - 1; // 減去第一個普通閥件
            if (valveIndexInBranchModuleCards === branchModuleIndex) {
              connectionsToRemove.push(index);
            }
          }
        }
        
        // 檢查是否是分支模組內部的連接線
        if (conn.branchModuleIndex === branchModuleIndex) {
          connectionsToRemove.push(index);
        }
      });
      
      // 從後往前刪除，避免索引改變
      connectionsToRemove.reverse().forEach(index => {
        moduleSet.connections.splice(index, 1);
      });
      
      console.log(`已刪除 ${connectionsToRemove.length} 條分支閥件相關連接線`);
    },
    
    /**
     * 更新連接線索引
     * @param {Object} moduleSet - 模組組對象
     * @param {number} deletedBranchModuleIndex - 被刪除的分支模組索引
     */
    updateConnectionIndices(moduleSet, deletedBranchModuleIndex) {
      console.log('更新連接線索引');
      
      // 更新所有分支模組相關連接線的索引
      moduleSet.connections.forEach(conn => {
        if (conn.branchModuleIndex !== undefined && 
            conn.branchModuleIndex > deletedBranchModuleIndex) {
          conn.branchModuleIndex = conn.branchModuleIndex - 1;
        }
        
        if (conn.branchValveCardIndex !== undefined && 
            conn.branchValveCardIndex > deletedBranchModuleIndex + 1) {
          conn.branchValveCardIndex = conn.branchValveCardIndex - 1;
        }
      });
      
      console.log('已更新連接線索引');
    },
    // ==================== 卡片位置和連接線更新 ====================
    /**
     * 更新已存在的 Panel+Equipment 群組的連接線起始點
     * @param {Object} moduleSet - 模組組對象
     */
    updateExistingPanelConnections(moduleSet) {
      console.log('更新已存在的 Panel+Equipment 群組連接線起始點');
      
      if (!moduleSet.panelEquipmentGroups?.length) {
        console.log('沒有 Panel+Equipment 群組需要更新');
        return;
      }
      
      const iconPosition = this.calculateAdditionalIconPosition(moduleSet);
      const iconY = moduleSet.floor.position.y;
      
      // 更新所有從 additional-icon 到 panel 的連接線起始點
      moduleSet.connections.forEach(conn => {
        if (conn.from === 'additional-icon' && conn.fromPosition) {
          conn.fromPosition = { x: iconPosition, y: iconY };
          console.log(`更新連接線起始點: (${iconPosition}, ${iconY})`);
        }
      });
      
      console.log('已更新所有 Panel+Equipment 群組的連接線起始點');
    },
    
    /**
     * 將卡片往右推移
     * @param {Object} moduleSet - 模組組對象
     * @param {number} startX - 起始 X 位置
     */
    shiftCardsRight(moduleSet, startX) {
      const distances = this.calculateShiftDistances(moduleSet);
      
      // 推移管線資訊卡片
      moduleSet.pipeline.position.x += distances.pipelineShift;
      
      // 推移樓層資訊卡片
      moduleSet.floor.position.x += distances.otherShift;
      
      // 推移所有 Panel+Equipment 群組
      if (moduleSet.panelEquipmentGroups) {
        moduleSet.panelEquipmentGroups.forEach(group => {
          group.panel.position.x += distances.otherShift;
          group.equipment.position.x += distances.otherShift;
          
          // 推移設備前的閥件（如果存在）
          if (group.valve) {
            group.valve.position.x += distances.otherShift;
          }
          
          // 推移額外的設備卡片
          if (group.additionalEquipmentCards && group.additionalEquipmentCards.length > 0) {
            group.additionalEquipmentCards.forEach(card => {
              card.position.x += distances.otherShift;
            });
          }
        });
      }
      
      this.updateConnectionsAfterShift(moduleSet);
      console.log('已將卡片往右推移，管線推移距離:', distances.pipelineShift, '其他卡片推移距離:', distances.otherShift);
    },
    
    /**
     * 計算卡片推移距離
     * @param {Object} moduleSet - 模組組對象
     * @returns {Object} 包含不同推移距離的對象
     */
    calculateShiftDistances(moduleSet) {
      // 計算管線資訊到樓層資訊的距離
      const pipelineRightX = moduleSet.pipeline.position.x + CARD_WIDTH;
      const floorLeftX = moduleSet.floor.position.x + 223;
      const pipelineToFloorDistance = floorLeftX - pipelineRightX;
      
      return {
        pipelineShift: pipelineToFloorDistance,
        otherShift: CARD_WIDTH + 20
      };
    },
    
    /**
     * 更新連接線配置
     * @param {Object} moduleSet - 模組組對象
     */
    updateConnectionsAfterShift(moduleSet) {
      const shiftDistance = this.calculateShiftDistances(moduleSet).otherShift;
      
      // 更新所有使用自定義 fromPosition 和 toPosition 的連接線
      // 只更新與 Panel-Equipment 相關的連接線（包括 panel-equipment-valve 相關的）
      moduleSet.connections.forEach(conn => {
        // 更新 panel → panel-equipment-valve 和 panel-equipment-valve → equipment 的連接線
        if (conn.from === 'panel' && conn.to === 'panel-equipment-valve' || 
            conn.from === 'panel-equipment-valve' && conn.to === 'equipment' ||
            conn.from === 'panel-equipment-valve' && conn.to === 'additional-equipment') {
          if (conn.fromPosition) {
            conn.fromPosition.x += shiftDistance;
          }
          if (conn.toPosition) {
            conn.toPosition.x += shiftDistance;
          }
        }
        // 更新額外設備卡片的連接線
        else if (conn.from === 'panel' && conn.to === 'panel-equipment-connection' ||
                 conn.from === 'panel-equipment-connection' && conn.to === 'additional-equipment') {
          if (conn.fromPosition) {
            conn.fromPosition.x += shiftDistance;
          }
          if (conn.toPosition) {
            conn.toPosition.x += shiftDistance;
          }
        }
      });
      
      console.log('連接線已更新以適應新的卡片位置，推移距離:', shiftDistance);
    },
    
    /**
     * 為閥件資訊更新連接線配置
     * @param {Object} moduleSet - 模組組對象
     */
    updateConnectionsForValve(moduleSet) {
      const sourceToPipelineIndex = moduleSet.connections.findIndex(conn => 
        conn.from === 'source' && conn.to === 'pipeline'
      );
      
      if (sourceToPipelineIndex !== -1) {
        // 修改原始連接線：source → valve
        moduleSet.connections[sourceToPipelineIndex] = {
          from: 'source',
          to: 'valve',
          showAdditionalIcon: false,
          showFaIcon: true,
          valveCardIndex: moduleSet.valveCards.length - 1
        };
        
        // 添加新的連接線：valve → pipeline
        moduleSet.connections.splice(sourceToPipelineIndex + 1, 0, {
          from: 'valve',
          to: 'pipeline',
          showAdditionalIcon: false,
          showFaIcon: false,
          valveCardIndex: moduleSet.valveCards.length - 1
        });
        
        console.log('已更新連接線配置：source → valve → pipeline');
      }
    },
    
    /**
     * 復原卡片位置
     * @param {Object} moduleSet - 模組組對象
     */
    restoreCardsPosition(moduleSet) {
      console.log('復原卡片位置');
      
      const restoreDistance = CARD_WIDTH + 20; // 252px
      
      // 復原管線資訊卡片位置
      moduleSet.pipeline.position.x -= restoreDistance;
      
      // 復原樓層資訊卡片位置
      moduleSet.floor.position.x -= restoreDistance;
      
      // 復原所有 Panel+Equipment 群組位置
      if (moduleSet.panelEquipmentGroups) {
        moduleSet.panelEquipmentGroups.forEach(group => {
          group.panel.position.x -= restoreDistance;
          group.equipment.position.x -= restoreDistance;
          
          // 復原額外的設備卡片位置
          if (group.additionalEquipmentCards && group.additionalEquipmentCards.length > 0) {
            group.additionalEquipmentCards.forEach(card => {
              card.position.x -= restoreDistance;
            });
          }
        });
      }
      
      console.log('已復原卡片位置，復原距離:', restoreDistance);
    },
    
    /**
     * 復原連接線配置
     * @param {Object} moduleSet - 模組組對象
     */
    restoreConnectionsForValve(moduleSet) {
      console.log('復原連接線配置');
      
      const sourceToValveIndex = moduleSet.connections.findIndex(conn => 
        conn.from === 'source' && conn.to === 'valve'
      );
      
      if (sourceToValveIndex !== -1) {
        // 將 source 到 valve 的連接線改回 source 到 pipeline
        moduleSet.connections[sourceToValveIndex] = {
          from: 'source',
          to: 'pipeline',
          showAdditionalIcon: false,
          showFaIcon: true
        };
        
        // 找到 valve 到 pipeline 的連接線並刪除
        const valveToPipelineIndex = moduleSet.connections.findIndex(conn => 
          conn.from === 'valve' && conn.to === 'pipeline'
        );
        
        if (valveToPipelineIndex !== -1) {
          moduleSet.connections.splice(valveToPipelineIndex, 1);
        }
        
        console.log('已復原連接線配置：source → pipeline');
      }
    },
    // ==================== Popup 管理 ====================
    /**
     * 顯示 Popup
     * @param {Object} config - Popup 配置
     */
    showPopup(config) {
      this.popupConfig = {
        visible: true,
        title: config.title || '',
        message: config.message || '',
        buttons: config.buttons || [{ text: '確定', class: 'primary', action: 'confirm' }],
        showIcon: config.showIcon !== false,
        closeOnOverlay: config.closeOnOverlay !== false
      };
    },
    
    /**
     * 關閉 Popup
     */
    closePopup() {
      this.popupConfig.visible = false;
    },
    
    /**
     * 處理 Popup 按鈕點擊事件
     * @param {Object} event - 事件對象
     */
    handlePopupButtonClick(event) {
      console.log('Popup button clicked:', event);
      // 可以在這裡處理特定的按鈕點擊邏輯
    },
    
    /**
     * 快速顯示警告 popup
     * @param {string} message - 警告訊息
     * @param {Function} onConfirm - 確認回調函數
     */
    showWarningPopup(message, onConfirm = null) {
      this.showPopup({
        title: '',
        message,
        buttons: [
          {
            text: '確定',
            class: 'primary',
            action: onConfirm || 'confirm'
          }
        ],
        showIcon: true
      });
    },
    
    /**
     * 快速顯示確認 popup
     * @param {string} message - 確認訊息
     * @param {Function} onDelete - 刪除回調函數
     * @param {Function} onCancel - 取消回調函數
     */
    showConfirmPopup(message, onDelete = null, onCancel = null) {
      this.showPopup({
        title: '',
        message,
        buttons: [
          {
            text: '取消',
            class: 'default',
            action: onCancel || 'cancel'
          },
          {
            text: '刪除',
            class: 'danger',
            action: onDelete || 'delete'
          }
        ],
        showIcon: true
      });
    },
    // ==================== 測試方法 ====================
    /**
     * 測試：手動觸發添加 Panel+Equipment 模組
     */
    testAddPanelEquipmentModule() {
      const mockConnection = { id: 'line-0-2' };
      const { moduleSetIndex } = this.parseConnectionId(mockConnection.id);
      const moduleSet = this.allModuleSets[moduleSetIndex];
      const connIndex = parseInt(mockConnection.id.split('-')[2]);
      const connConfig = moduleSet.connections[connIndex];
      this.addPanelEquipmentModule(connConfig, moduleSetIndex);
    },
    
    /**
     * 測試：為所有模組添加 Panel+Equipment 群組
     */
    testAddPanelEquipmentForAllModules() {
      console.log('測試為所有模組添加 Panel+Equipment 群組');
      
      this.allModuleSets.forEach((moduleSet, setIndex) => {
        const floorToPanelConnection = moduleSet.connections.find(conn => 
          conn.from === 'floor' && conn.to === 'panel'
        );
        
        if (floorToPanelConnection) {
          console.log(`為模組組 ${setIndex} 添加 Panel+Equipment 群組`);
          this.addPanelEquipmentModule(floorToPanelConnection, setIndex);
        }
      });
    },
    
    /**
     * 測試：添加分支閥件功能
     */
    testAddBranchValve() {
      console.log('測試添加分支閥件功能');
      
      // 1. 先添加普通閥件
      const mockConnection1 = { id: 'line-0-0' };
      this.addValveInfoCard(mockConnection1, 0);
      
      // 等待一下讓閥件添加完成
      setTimeout(() => {
        // 2. 再次點擊紫色圖標，應該添加分支閥件
        // 注意：此時連接線已經變為 source → valve 或 valve → pipeline
        const mockConnection2 = { id: 'line-0-0' }; // 點擊 source → valve 連接線
        this.handleFaIconClick(mockConnection2);
        
        console.log('測試完成：添加分支閥件');
      }, 500);
    },
    
    /**
     * 測試：多次點擊紫色圖標添加多個分支閥件
     */
    testMultipleBranchValves() {
      console.log('測試多次點擊紫色圖標添加多個分支閥件');
      
      // 1. 先添加普通閥件
      const mockConnection1 = { id: 'line-0-0' };
      this.addValveInfoCard(mockConnection1, 0);
      
      // 等待一下讓閥件添加完成
      setTimeout(() => {
        // 2. 添加第一個分支閥件（包含完整模組）
        const mockConnection2 = { id: 'line-0-0' };
        this.handleFaIconClick(mockConnection2);
        
        setTimeout(() => {
          // 3. 添加第二個分支閥件（包含完整模組）
          const mockConnection3 = { id: 'line-0-0' };
          this.handleFaIconClick(mockConnection3);
          
          console.log('測試完成：添加多個分支閥件完整模組');
        }, 500);
      }, 500);
    },
    
    /**
     * 測試：查看分支模組結構
     */
    testViewBranchModuleStructure() {
      console.log('查看分支模組結構');
      this.allModuleSets.forEach((moduleSet, index) => {
        console.log(`模組組 ${index}:`, moduleSet);
        if (moduleSet.branchModuleCards) {
          console.log(`  分支模組數量: ${moduleSet.branchModuleCards.length}`);
          moduleSet.branchModuleCards.forEach((branchModule, branchIndex) => {
            console.log(`    分支模組 ${branchIndex}:`, branchModule);
          });
        }
        if (moduleSet.connections) {
          console.log(`  連接線數量: ${moduleSet.connections.length}`);
          moduleSet.connections.forEach((conn, connIndex) => {
            console.log(`    連接線 ${connIndex}:`, conn);
          });
        }
      });
    },
    
    /**
     * 測試：測試分支閥件位置計算
     */
    testBranchValvePositionCalculation() {
      console.log('測試分支閥件位置計算');
      
      const moduleSet = this.allModuleSets[0];
      if (moduleSet) {
        const calculatedY = this.calculateBranchValveYPosition(moduleSet);
        console.log('計算出的分支閥件Y位置:', calculatedY);
        
        // 顯示各卡片的位置信息
        console.log('各卡片位置信息:', {
          source: {
            y: moduleSet.source.position.y,
            height: this.getCardHeight('source'),
            bottomY: moduleSet.source.position.y + this.getCardHeight('source')
          },
          pipeline: {
            y: moduleSet.pipeline.position.y,
            height: this.getCardHeight('pipeline'),
            bottomY: moduleSet.pipeline.position.y + this.getCardHeight('pipeline')
          },
          floor: {
            y: moduleSet.floor.position.y,
            height: this.getCardHeight('floor'),
            bottomY: moduleSet.floor.position.y + this.getCardHeight('floor')
          }
        });
      }
    },
    
    /**
     * 測試：測試分支源頭資訊連接線顯示
     */
    testBranchSourceConnectionLine() {
      console.log('測試分支源頭資訊連接線顯示');
      
      // 1. 先添加分支閥件
      const mockConnection1 = { id: 'line-0-0' };
      this.addValveInfoCard(mockConnection1, 0);
      
      setTimeout(() => {
        // 2. 添加分支閥件
        const mockConnection2 = { id: 'line-0-0' };
        this.handleFaIconClick(mockConnection2);
        
        setTimeout(() => {
          // 3. 添加分支源頭資訊
          const mockBranchData = {
            type: 'branch-source',
            position: { x: 100, y: 1200 },
            sourcePosition: { x: 100, y: 80 }
          };
          this.handleAddBranchSource(mockBranchData);
          
          setTimeout(() => {
            // 4. 檢查連接線
            console.log('檢查分支源頭資訊連接線:');
            this.testViewBranchModuleStructure();
          }, 500);
        }, 500);
      }, 500);
    }
  }
}
</script>
