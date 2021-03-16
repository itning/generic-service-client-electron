import {Component, EventEmitter, OnInit} from '@angular/core';
import {FormParamsInfo, PersistenceService} from '../../../../service/persistence.service';
import {RequestModel} from '../attribute/attribute.component';
import {GenericService, Item, TabInfo} from '../../../../service/generic.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import {Base64} from 'js-base64';
import {v4 as uuidv4} from 'uuid';
import {UtilsService} from '../../../../service/utils.service';

@Component({
  selector: 'app-generic',
  templateUrl: './generic.component.html',
  styleUrls: ['./generic.component.scss']
})
export class GenericComponent implements OnInit {
  tabs: TabInfo[] = [];
  nowSelectedTabIndex = 0;
  clearLogEvent: EventEmitter<void> = new EventEmitter<void>();
  lastJsonInfo: string;
  isShowImportModal: boolean;
  isShowExportModal: boolean;
  importTabBase64Str: string;
  exportInfo: string;

  constructor(private persistenceService: PersistenceService,
              private genericService: GenericService,
              private message: NzMessageService,
              private util: UtilsService) {
  }

  ngOnInit(): void {
    this.tabs = this.persistenceService.getGenericParamInfo();
    if (!this.tabs || this.tabs.length === 0) {
      this.tabs.push(new TabInfo(uuidv4(), 'Unnamed Tab', this.genericService.generateFormParams(), [], []));
    }
    const index = this.persistenceService.getMetaInfo('nowSelectedTabIndex');
    if (index && !Number.isNaN(index)) {
      this.nowSelectedTabIndex = index > this.tabs.length - 1 ? this.tabs.length - 1 : index;
    }
  }

  private filterUseAttributeNotTrue(items: Item[]): Item[] {
    return items.filter(item => item.use).map(item => {
      if (item.attributeValue instanceof Array) {
        item.attributeValue = this.filterUseAttributeNotTrue(item.attributeValue as Item[]);
      }
      return item;
    });
  }

  handleRequest(tab: TabInfo): void {
    this.persistenceService.saveGenericParamInfo(this.tabs);
    const parameterValue = this.filterUseAttributeNotTrue(JSON.parse(JSON.stringify(tab.parameterValue)));
    const resultObj = this.genericService.conversionRequest(parameterValue);
    const result: RequestModel = Object.assign(tab.formParams.value as FormParamsInfo, {params: resultObj});
    const newResult: RequestModel = JSON.parse(JSON.stringify(result));
    if (newResult.path) {
      newResult.interfaceName = newResult.path;
    }
   // newResult.url = `dubbo://${newResult.url}`;
    tab.isRequestLoading = this.genericService.sendGenericRequest(newResult, tab.id);
  }

  handleTabSelect(index: number): void {
    this.nowSelectedTabIndex = index;
    this.persistenceService.saveMetaInfo('nowSelectedTabIndex', index);
  }

  handleClearResult($event: MouseEvent): void {
    $event.stopPropagation();
    this.tabs[this.nowSelectedTabIndex].resultData = [];
  }

  handleClearLog($event: MouseEvent): void {
    $event.stopPropagation();
    this.clearLogEvent.emit();
  }

  handleCopyJsonResult($event: MouseEvent): void {
    $event.stopPropagation();
    if (!this.lastJsonInfo) {
      this.message.warning('暂无JSON结果，请发起调用成功后再试！');
      return;
    }
    this.util.copyToClip(this.lastJsonInfo);
  }

  handleImportAllTags($event: MouseEvent): void {
    $event.stopPropagation();
    this.importTabBase64Str = '';
    this.isShowImportModal = true;
  }

  handleExportNowTag($event: MouseEvent): void {
    $event.stopPropagation();
    this.exportInfo = '';
    if (!this.tabs || this.tabs.length === 0 || !this.tabs[this.nowSelectedTabIndex]) {
      this.message.warning('没有可导出的TAB！');
      return;
    }
    const tab = this.tabs[this.nowSelectedTabIndex];
    const encode = Base64.encode(JSON.stringify([{
      tabName: tab.tabName,
      formParamsValue: tab.formParams.value as FormParamsInfo,
      parameterValue: tab.parameterValue,
      selectEnv: tab.selectEnv
    }]));
    this.exportInfo = encode;
    this.isShowExportModal = true;
    this.util.copyToClip(encode);
  }

  handleExportAllTags($event: MouseEvent): void {
    $event.stopPropagation();
    this.exportInfo = '';
    if (!this.tabs || this.tabs.length === 0) {
      this.message.warning('没有可导出的TAB！');
      return;
    }
    const save = this.tabs.map(tab => {
      return {
        tabName: tab.tabName,
        formParamsValue: tab.formParams.value as FormParamsInfo,
        parameterValue: tab.parameterValue,
        selectEnv: tab.selectEnv
      };
    });
    const encode = Base64.encode(JSON.stringify(save));
    this.exportInfo = encode;
    this.isShowExportModal = true;
    this.util.copyToClip(encode);
  }

  handleLastJsonInfoChange(json: string): void {
    this.lastJsonInfo = json;
  }

  doImport(): void {
    if (!this.importTabBase64Str) {
      this.message.error('请输入要导入的TAB信息');
      return;
    }
    try {
      const decode = Base64.decode(this.importTabBase64Str);
      const parse = JSON.parse(decode);
      const importTabs = parse.map(item => {
        const formGroup = this.genericService.generateFormParams(
          item.formParamsValue.url,
          item.formParamsValue.interfaceName,
          item.formParamsValue.method,
          item.formParamsValue.version,
          item.formParamsValue.group,
          item.formParamsValue.path
        );
        return new TabInfo(uuidv4(), item.tabName ? item.tabName : 'Unnamed Tab', formGroup, item.parameterValue, [], item.selectEnv);
      });
      importTabs.forEach(tab => this.tabs.push(tab));
      this.isShowImportModal = false;
      this.importTabBase64Str = '';
      this.persistenceService.saveGenericParamInfo(this.tabs);
      this.nowSelectedTabIndex = this.tabs.length - 1;
      this.message.success('导入成功');
    } catch (e) {
      console.error(e);
      this.message.error('导入失败');
    }
  }

  handleCopyNowTag($event: MouseEvent): void {
    $event.stopPropagation();
    if (!this.tabs || this.tabs.length === 0 || !this.tabs[this.nowSelectedTabIndex]) {
      this.message.warning('没有可复制的TAB！');
      return;
    }
    const needCopyTabInfo = this.tabs[this.nowSelectedTabIndex];
    const newNeedCopyTabInfo = JSON.parse(JSON.stringify({
      formParamsValue: needCopyTabInfo.formParams.value as FormParamsInfo,
      parameterValue: needCopyTabInfo.parameterValue
    }));
    const formGroup = this.genericService.generateFormParams(
      newNeedCopyTabInfo.formParamsValue.url,
      newNeedCopyTabInfo.formParamsValue.interfaceName,
      newNeedCopyTabInfo.formParamsValue.method,
      newNeedCopyTabInfo.formParamsValue.version,
      newNeedCopyTabInfo.formParamsValue.group,
      newNeedCopyTabInfo.formParamsValue.path
    );
    const newTabInfo = new TabInfo(uuidv4(), 'Unnamed Tab', formGroup, newNeedCopyTabInfo.parameterValue, []);
    this.tabs.push(newTabInfo);
    this.persistenceService.saveGenericParamInfo(this.tabs);
    this.nowSelectedTabIndex = this.tabs.length - 1;
    this.message.success('复制成功！');
  }
}
