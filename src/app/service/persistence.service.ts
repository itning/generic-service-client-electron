import {Injectable} from '@angular/core';
import {Base64} from 'js-base64';
import {FormBuilder, Validators} from '@angular/forms';
import {EnvInfo, Item, TabInfo} from './generic.service';

@Injectable({
  providedIn: 'root'
})
export class PersistenceService {
  /**
   * 保存泛化调用参数信息的持久化唯一键
   * @private
   */
  private static readonly GENERIC_PARAM_INFO_KEY = 'TEST_BOX_PERSISTENCE_GENERIC_PARAM_INFO';

  /**
   * 保存选择的TAB页的持久化唯一键
   * @private
   */
  private static readonly GENERIC_META_INFO_KEY = 'TEST_BOX_PERSISTENCE_META_INFO';

  constructor(private fb: FormBuilder) {
  }

  saveMetaInfo(key: string, value: any): void {
    const base64Str = window.localStorage.getItem(PersistenceService.GENERIC_META_INFO_KEY);
    let info;
    if (null === base64Str) {
      info = {};
    } else {
      const json = Base64.decode(base64Str);
      info = JSON.parse(json);
    }

    info[key] = value;
    const encode = Base64.encode(JSON.stringify(info));
    window.localStorage.setItem(PersistenceService.GENERIC_META_INFO_KEY, encode);
  }

  getMetaInfo(key: string): any {
    return this.getMetaInfos()[key];
  }

  getMetaInfos(): any {
    const base64Str = window.localStorage.getItem(PersistenceService.GENERIC_META_INFO_KEY);
    if (null === base64Str) {
      return {};
    }
    try {
      const json = Base64.decode(base64Str);
      return JSON.parse(json);
    } catch (e) {
      window.localStorage.removeItem(PersistenceService.GENERIC_META_INFO_KEY);
      return {};
    }
  }

  /**
   * 保存泛化调用参数信息
   * @param tabs TAB页
   */
  saveGenericParamInfo(tabs: TabInfo[]): void {
    const save: PersistenceGenericParamInfo = tabs.map(tab => {
      return {
        id: tab.id,
        tabName: tab.tabName,
        formParamsValue: tab.formParams.value as FormParamsInfo,
        parameterValue: tab.parameterValue,
        selectEnv: tab.selectEnv
      };
    });
    const encode = Base64.encode(JSON.stringify(save));
    window.localStorage.setItem(PersistenceService.GENERIC_PARAM_INFO_KEY, encode);
  }

  /**
   * 获取保存的泛化调用参数信息
   */
  getGenericParamInfo(): TabInfo[] {
    const base64Str = window.localStorage.getItem(PersistenceService.GENERIC_PARAM_INFO_KEY);
    if (null === base64Str) {
      return [];
    }
    try {
      const json = Base64.decode(base64Str);
      const info: PersistenceGenericParamInfo = JSON.parse(json);
      return info.map(item => {
        const formGroup = this.fb.group({
          url: [item.formParamsValue.url, [Validators.required]],
          interfaceName: [item.formParamsValue.interfaceName, [Validators.required]],
          method: [item.formParamsValue.method, [Validators.required]],
          version: [item.formParamsValue.version, []],
          group: [item.formParamsValue.group, []],
          path: [item.formParamsValue.path]
        });
        return new TabInfo(item.id, item.tabName, formGroup, item.parameterValue, [], item.selectEnv);
      });
    } catch (e) {
      window.localStorage.removeItem(PersistenceService.GENERIC_PARAM_INFO_KEY);
      return [];
    }
  }
}

export type PersistenceGenericParamInfo =
  { id: string, tabName: string, formParamsValue: FormParamsInfo, parameterValue: Item[], selectEnv: EnvInfo }[];
export type FormParamsInfo = { url: string, interfaceName: string, method: string, version: string, group: string, path: string };
