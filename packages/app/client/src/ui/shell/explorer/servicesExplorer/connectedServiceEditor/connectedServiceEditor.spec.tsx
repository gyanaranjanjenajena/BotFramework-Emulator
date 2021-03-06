import { PrimaryButton } from '@bfemulator/ui-react';
import { LuisService } from 'botframework-config/lib/models';
import { ServiceTypes } from 'botframework-config/lib/schema';
import { mount } from 'enzyme';
import * as React from 'react';
import { Provider } from 'react-redux';
import { combineReducers, createStore } from 'redux';
import { azureAuth } from '../../../../../data/reducer/azureAuthReducer';
import { DialogService } from '../../../../dialogs/service';
import { ConnectedServiceEditor } from './connectedServiceEditor';
import { ConnectedServiceEditorContainer } from './connectedServiceEditorContainer';

jest.mock('../../../../dialogs/service', () => ({
  DialogService: {
    showDialog: () => Promise.resolve(true),
    hideDialog: () => Promise.resolve(false),
  }
}));

jest.mock('../../../../dialogs/', () => ({
  AzureLoginPromptDialogContainer: () => undefined,
  AzureLoginSuccessDialogContainer: () => undefined,
  BotCreationDialog: () => undefined,
  DialogService: { showDialog: () => Promise.resolve(true) },
  SecretPromptDialog: () => undefined
}));

jest.mock('./connectedServiceEditor.scss', () => ({}));

describe('The ConnectedServiceEditor component ', () => {
  let parent;
  let node;
  let mockService;

  beforeEach(() => {
    mockService = JSON.parse(`{
            "type": "luis",
            "id": "b5af3f67-7ec8-444a-ae91-c4f02883c8f4",
            "name": "It's mathmatical!",
            "version": "0.1",
            "appId": "121221",
            "authoringKey": "poo",
            "subscriptionKey": "emoji"
        }`);
    parent = mount(<Provider store={ createStore(combineReducers({ azureAuth })) }>
      <ConnectedServiceEditorContainer connectedService={ mockService } serviceType={ mockService.type }/>
    </Provider>);
    node = parent.find(ConnectedServiceEditor);
  });

  it('should render deeply', () => {
    expect(parent.find(ConnectedServiceEditorContainer)).not.toBe(null);
    expect(parent.find(ConnectedServiceEditor)).not.toBe(null);
  });

  it('should contain a cancel and updateConnectedService functions in the props', () => {
    expect(typeof (node.props() as any).cancel).toBe('function');
    expect(typeof (node.props() as any).updateConnectedService).toBe('function');
  });

  it('should exit with a 0 value when canceled', () => {
    const spy = jest.spyOn(DialogService, 'hideDialog');
    const instance = node.instance();
    instance.props.cancel();
    expect(spy).toHaveBeenCalledWith(0);
  });

  it('should make a copy of the connected service passed in the props', () => {
    const instance = node.instance();
    expect(instance.state.connectedServiceCopy instanceof LuisService).toBeTruthy();
    expect(instance.state.connectedServiceCopy === mockService).toBeFalsy();
  });

  it('should produce an error when a required input field is null', () => {
    const instance = node.instance();
    const mockEvent = { target: { value: '', dataset: { prop: 'name' } } };
    instance.onInputChange(mockEvent as any);
    expect(instance.state.connectedServiceCopy.name).toBe('');
    expect(instance.state.nameError).not.toBeNull();
  });

  it('should exit with the newly edited model when clicking submit', () => {
    const spy = jest.spyOn(DialogService, 'hideDialog');
    const instance = node.instance();
    const mockEvent = { target: { value: 'renamed model', dataset: { prop: 'name' } } };
    instance.onInputChange(mockEvent as any);
    instance.onSubmitClick();
    const mockMock = { ...mockService };
    mockMock.name = 'renamed model';
    expect(spy).toHaveBeenCalledWith([new LuisService(mockMock)]);
  });

  it('should enable the submit button when all required fields have non-null values', () => {
    const instance = node.instance();
    const mockEvent = { target: { value: 'renamed model', dataset: { prop: 'name' } } };
    instance.onInputChange(mockEvent as any);
    mockEvent.target.dataset.prop = 'subscriptionKey';
    mockEvent.target.value = '';
    instance.onInputChange(mockEvent as any); // non-required field
    instance.render();
    const submitBtn = node.find(PrimaryButton);
    expect(submitBtn.props.disabled).toBeFalsy();
  });

  it('should update the connectedServiceCopy.configuration when the "onKvPairChange()" handler is called', () => {
    const instance = node.instance();
    const mockData = {
      someKey: 'Some Value'
    };

    instance.onKvPairChange(mockData);

    expect(instance.state.connectedServiceCopy.configuration).toEqual(mockData);
  });
});

describe('The ConnectedServiceEditor component should render the correct content when the service type is', () => {
  let parent;
  let node;
  let mockService = JSON.parse(`{
            "id": "b5af3f67-7ec8-444a-ae91-c4f02883c8f4",
            "name": "It's mathmatical!",
            "version": "0.1",
            "appId": "121221",
            "authoringKey": "poo",
            "subscriptionKey": "emoji"
        }`);
  const services = [
    ServiceTypes.Luis,
    ServiceTypes.Dispatch,
    ServiceTypes.QnA,
    ServiceTypes.AppInsights,
    ServiceTypes.BlobStorage,
    ServiceTypes.CosmosDB,
    ServiceTypes.Generic
  ];

  beforeEach(() => {
    mockService.type = services.shift();
    parent = mount(<Provider store={ createStore(combineReducers({ azureAuth })) }>
      <ConnectedServiceEditorContainer connectedService={ mockService } serviceType={ mockService.type }/>
    </Provider>);
    node = parent.find(ConnectedServiceEditor);
  });

  it('ServiceTypes.Luis', () => {
    const instance = node.instance();
    expect(instance.learnMoreLink).toBe('http://aka.ms/bot-framework-emulator-LUIS-docs-home');
    expect(instance.editableFields).toEqual(['name', 'appId', 'authoringKey', 'version', 'subscriptionKey']);
    expect(instance.headerContent).toEqual(instance.luisAndDispatchHeader);
  });

  it('ServiceTypes.Dispatch', () => {
    const instance = node.instance();
    expect(instance.learnMoreLink).toBe('https://aka.ms/bot-framework-emulator-create-dispatch');
    expect(instance.editableFields).toEqual(['name', 'appId', 'authoringKey', 'version', 'subscriptionKey']);
    expect(instance.headerContent).toEqual(instance.luisAndDispatchHeader);
  });

  it('ServiceTypes.QnA', () => {
    const instance = node.instance();
    expect(instance.learnMoreLink).toBe('http://aka.ms/bot-framework-emulator-qna-keys');
    expect(instance.editableFields).toEqual(['name', 'kbId', 'hostname', 'subscriptionKey', 'endpointKey']);
    expect(instance.headerContent).toEqual(instance.qnaHeader);
  });

  it('ServiceTypes.AppInsights', () => {
    const instance = node.instance();
    expect(instance.learnMoreLink).toBe('https://aka.ms/bot-framework-emulator-appinsights-keys');
    expect(instance.editableFields).toEqual([
      'name',
      'tenantId',
      'subscriptionKey',
      'resourceGroup',
      'serviceName',
      'instrumentationKey',
      'applicationId'
    ]);
    expect(instance.headerContent).toEqual(instance.appInsightsAndBlobStorageHeader);
  });

  it('ServiceTypes.Blob', () => {
    const instance = node.instance();
    expect(instance.learnMoreLink).toBe('https://aka.ms/bot-framework-emulator-storage-keys');
    expect(instance.editableFields).toEqual([
      'name',
      'tenantId',
      'subscriptionKey',
      'resourceGroup',
      'serviceName',
      'connectionString',
      'container'
    ]);
    expect(instance.headerContent).toEqual(instance.appInsightsAndBlobStorageHeader);
  });

  it('ServiceTypes.CosmosDB', () => {
    const instance = node.instance();
    expect(instance.learnMoreLink).toBe('https://aka.ms/bot-framework-emulator-cosmosdb-keys');
    expect(instance.editableFields).toEqual([
      'name',
      'tenantId',
      'subscriptionKey',
      'resourceGroup',
      'serviceName',
      'endpoint',
      'database',
      'collection'
    ]);
    expect(instance.headerContent).toEqual(instance.cosmosDbHeader);
  });

  it('ServiceTypes.Generic', () => {
    const instance = node.instance();
    expect(instance.editableFields).toEqual([
      'name',
      'url'
    ]);

    expect(instance.headerContent).toEqual(instance.genericHeader);
  });
});
