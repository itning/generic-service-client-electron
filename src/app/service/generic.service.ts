import {Injectable} from '@angular/core';
import {RequestModel} from '../module/generic/component/attribute/attribute.component';
import {HttpClient} from '@angular/common/http';
import {Observable, Subject} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {AppConfig} from '../../environments/environment';
import {v4 as uuidv4} from 'uuid';
import {NzMessageService} from 'ng-zorro-antd/message';
import {AutocompleteDataSource} from 'ng-zorro-antd/auto-complete/autocomplete.component';
import {ElectronService, EventType} from "./electron.service";

@Injectable({
  providedIn: 'root'
})
export class GenericService {

  private token: string;
  private resultSubject: Subject<WebSocketResultModel>;
  private textDecoder: TextDecoder;

  constructor(private http: HttpClient,
              private message: NzMessageService,
              private fb: FormBuilder,
              private electronService: ElectronService) {
    this.textDecoder = new TextDecoder();
  }

  sendGenericRequest(requestModel: RequestModel, echo: string): boolean {
    this.getWebSocketToken().subscribe(token => {
      // tslint:disable-next-line
      requestModel['token'] = token;
      // tslint:disable-next-line
      requestModel['echo'] = echo;
      this.electronService.sendEvent(EventType.REQUEST, requestModel);
    });
    return true;
  }

  sendMavenRequest(mavenRequest: MavenRequest): Observable<MavenResponse<void>> {
    return this.getWebSocketToken().pipe(mergeMap(token => {
      mavenRequest.token = token;
      return this.http.post<MavenResponse<void>>(`http://${AppConfig.baseUrl}/nexus/dependency/download`, mavenRequest);
    }));
  }

  getWebSocketToken(): Observable<string> {
    if (!this.token) {
      return this.http.get(`http://${AppConfig.baseUrl}/socket_token`, {responseType: 'text'}).pipe(
        map(i => {
          if (this.token) {
            return this.token;
          }
          this.token = i;
          return i;
        })
      );
    } else {
      return new Observable(subscriber => {
        subscriber.next(this.token);
        subscriber.complete();
      });
    }
  }

  generateFormParams(url = '',
                     interfaceName = '',
                     method = '',
                     version = '',
                     group = '',
                     path = ''): FormGroup {
    return this.fb.group({
      url: [url, [Validators.required]],
      interfaceName: [interfaceName, [Validators.required]],
      method: [method, [Validators.required]],
      version: [version, []],
      group: [group, []],
      path: [path]
    });
  }

  private getRealValue(item: Item): string | number | boolean | null {
    switch (item.type) {
      case Type.STRING:
      case Type.DATE:
      case Type.DATE_8601:
        return item.attributeValue as string;
      case Type.NUMBER:
        const value = Number(item.attributeValue);
        if (Number.isNaN(value)) {
          this.message.error(`${item.attributeValue}非数字！`);
          throw new Error(`${item.attributeValue}非数字！`);
        }
        return value;
      case Type.BOOLEAN:
        return item.attributeValue === 'true';
      default:
        console.error(`非法调用 Type:${item.type}`);
        return null;
    }
  }

  connectionResultWebSocketReply(): Subject<WebSocketResultModel> {
    if (this.resultSubject) {
      return this.resultSubject;
    }
    this.resultSubject = new Subject<WebSocketResultModel>();
    //this.getWebSocketToken().pipe(mergeMap(token => this.connectionResultWebSocket(token))).subscribe(this.resultSubject);
    this.electronService.dubboResponse.subscribe(this.resultSubject)
    return this.resultSubject;
  }

  /**
   * 转换请求
   * @param items 参数列表
   * @private
   */
  conversionRequest(items: Item[]): any {
    const r = [];
    items.forEach(item => {
      const re = {};
      if (item.type === Type.OBJECT) {
        re[item.attributeName] = this.conversionRequestForItem(item.attributeValue as Item[]);
      } else if (item.type === Type.ARRAY) {
        re[item.attributeName] = this.conversionRequestForItemArray(item.attributeValue as Item[]);
      } else {
        re[item.attributeName] = this.getRealValue(item);
      }
      r.push(re);
    });
    return r;
  }

  conversionRequestForItem(items: Item[]): any {
    const result = {};
    items.map(item => {
      if (item.type === Type.OBJECT) {
        result[item.attributeName] = this.conversionRequestForItem(item.attributeValue as Item[]);
      } else if (item.type === Type.ARRAY) {
        result[item.attributeName] = (item.attributeValue as Item[]).map(it => {
          if (it.type === Type.OBJECT) {
            return this.conversionRequestForItem(it.attributeValue as Item[]);
          } else if (it.type === Type.ARRAY) {
            return this.conversionRequestForItemArray(it.attributeValue as Item[]);
          } else {
            return this.getRealValue(it);
          }
        });
      } else {
        result[item.attributeName] = this.getRealValue(item);
      }
    });
    return result;
  }

  conversionRequestForItemArray(items: Item[]): any {
    return items.map(it => {
      if (it.type === Type.OBJECT) {
        return this.conversionRequestForItem(it.attributeValue as Item[]);
      } else if (it.type === Type.ARRAY) {
        return this.conversionRequestForItemArray(it.attributeValue as Item[]);
      } else {
        return this.getRealValue(it);
      }
    });
  }
}

class WebSocketResultWrap {
  localMessage: boolean;
  message: string;
  data: ArrayBuffer;

  static local(message: string): WebSocketResultWrap {
    const w = new WebSocketResultWrap();
    w.localMessage = true;
    w.message = message;
    return w;
  }

  static wrap(data: ArrayBuffer): WebSocketResultWrap {
    const w = new WebSocketResultWrap();
    w.localMessage = false;
    w.data = data;
    return w;
  }
}

export class Artifact {
  groupId: string;
  artifactId: string;
  version: string;
}

export class MavenRequest {
  token: string;
  echo: string;
  dependency: string;
  interfaceName: string;
  methodName: string;
}

export class MavenResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class WebSocketResultModel {
  type: WebSocketMessageType;
  message: string;
  echo: string;

  constructor(type: WebSocketMessageType, echo: string, message: string) {
    this.type = type;
    this.message = message;
    this.echo = echo;
  }
}

export enum WebSocketMessageType {
  PLAINTEXT,
  JSON
}

export type AttributeNameType = string | undefined;
export type AttributeValueType =
  Item
  | number
  | string
  | boolean
  | number[]
  | string[]
  | Item[]
  | boolean[]
  | undefined;

/**
 * 参数每一项
 */
export class Item {
  id: string;
  attributeName: AttributeNameType;
  attributeValue: AttributeValueType;
  type: Type;
  placeholder: string;
  autoComplete: AutocompleteDataSource = [];
  show: boolean;
  use: boolean;
  attributeValueDate: Date;

  static generate(type: Type,
                  attributeName: AttributeNameType,
                  attributeValue: AttributeValueType,
                  placeholder?: string,
                  autoComplete?: AutocompleteDataSource,
                  attributeValueDate?: Date): Item {
    const item = new Item();
    item.id = uuidv4();
    item.type = type;
    item.attributeName = attributeName;
    item.attributeValue = attributeValue;
    item.placeholder = placeholder;
    item.autoComplete = autoComplete;
    item.show = true;
    item.use = true;
    item.attributeValueDate = attributeValueDate;
    return item;
  }

  static generateObject(attributeName: AttributeNameType, attributeValue: AttributeValueType): Item {
    return Item.generate(Type.OBJECT, attributeName, attributeValue);
  }

  static generateArray(attributeName: AttributeNameType, attributeValue: AttributeValueType): Item {
    return Item.generate(Type.ARRAY, attributeName, attributeValue);
  }

  static generateString(attributeName: AttributeNameType,
                        attributeValue: AttributeValueType,
                        placeholder = '',
                        autoComplete: AutocompleteDataSource = []): Item {
    return Item.generate(Type.STRING, attributeName, attributeValue, placeholder, autoComplete);
  }

  static generateNumber(attributeName: AttributeNameType,
                        attributeValue: AttributeValueType,
                        placeholder = '',
                        autoComplete: AutocompleteDataSource = []): Item {
    return Item.generate(Type.NUMBER, attributeName, attributeValue, placeholder);
  }

  static generateBoolean(attributeName: AttributeNameType,
                         attributeValue: AttributeValueType,
                         placeholder = '',
                         autoComplete: AutocompleteDataSource = []): Item {
    return Item.generate(Type.BOOLEAN, attributeName, attributeValue, placeholder);
  }

  static generateDate(attributeName: AttributeNameType,
                      attributeValue: AttributeValueType,
                      placeholder = '',
                      autoComplete: AutocompleteDataSource = [],
                      attributeValueDate: Date): Item {
    return Item.generate(Type.DATE, attributeName, attributeValue, placeholder, autoComplete, attributeValueDate);
  }

  static generateDATE_8601(attributeName: AttributeNameType,
                           attributeValue: AttributeValueType,
                           placeholder = '',
                           autoComplete: AutocompleteDataSource = [],
                           attributeValueDate: Date): Item {
    return Item.generate(Type.DATE_8601, attributeName, attributeValue, placeholder, autoComplete, attributeValueDate);
  }
}

export enum Type {
  STRING,
  NUMBER,
  BOOLEAN,
  ARRAY,
  OBJECT,
  DATE,
  DATE_8601
}

/**
 * TAB页信息
 */
export class TabInfo {
  id: string;
  tabName: string;
  formParams: FormGroup;
  parameterValue: Item[] = [];
  resultData: string[] = [];
  selectEnv: EnvInfo;
  availableInterface: string[];
  availableMethod: string[];
  isRequestLoading: boolean;

  constructor(id: string, tabName: string, formParams: FormGroup, parameterValue: Item[], resultData: string[], selectEnv?: EnvInfo) {
    this.id = id;
    this.tabName = tabName;
    this.formParams = formParams;
    this.parameterValue = parameterValue;
    this.resultData = resultData;
    this.selectEnv = selectEnv;
  }
}

/**
 * 环境信息
 */
export class EnvInfo {
  tag: string;
  env: string;

  constructor(info: string) {
    const splitIndex = info.indexOf('||');
    this.tag = info.substring(0, splitIndex);
    this.env = info.substring(splitIndex + 2);
  }
}

export class MethodInfo {
  signature: string;
  paramClassName: string[];
  property: { [key: string]: any }[];
}
