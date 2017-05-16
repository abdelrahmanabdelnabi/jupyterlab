// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  URLExt
} from '@jupyterlab/coreutils';

import {
  JSONExt, JSONObject
} from '@phosphor/coreutils';

import {
  IDisposable
} from '@phosphor/disposable';

import {
  ISignal, Signal
} from '@phosphor/signaling';

import {
  ServerConnection
} from '..';

import * as validate
  from './validate';


/**
 * The url for the contents service.
 */
const SERVICE_CONTENTS_URL = 'api/contents';

/**
 * The url for the file access.
 */
const FILES_URL = 'files';


/**
 * A namespace for contents interfaces.
 */
export
namespace Contents {
  /**
   * A contents model.
   */
  export
  interface IModel {
    /**
     * Name of the contents file.
     *
     * #### Notes
     *  Equivalent to the last part of the `path` field.
     */
    readonly name?: string;

    /**
     * The full file path.
     *
     * #### Notes
     * It will *not* start with `/`, and it will be `/`-delimited.
     */
    readonly path?: string;

    /**
     * The type of file.
     */
    readonly type?: ContentType;

    /**
     * Whether the requester has permission to edit the file.
     */
    readonly writable?: boolean;

    /**
     * File creation timestamp.
     */
    readonly created?: string;

    /**
     * Last modified timestamp.
     */
    readonly last_modified?: string;

    /**
     * Specify the mime-type of file contents.
     *
     * #### Notes
     * Only non-`null` when `content` is present and `type` is `"file"`.
     */
    readonly mimetype?: string;

    /**
     * The optional file content.
     */
    readonly content?: any;

    /**
     * The format of the file `content`.
     *
     * #### Notes
     * Only relevant for type: 'file'
     */
    readonly format?: FileFormat;
  }

  /**
   * A contents file type.
   */
  export
  type ContentType = 'notebook' | 'file' | 'directory';


  /**
   * A contents file format.
   */
  export
  type FileFormat = 'json' | 'text' | 'base64';

  /**
   * The options used to fetch a file.
   */
  export
  interface IFetchOptions extends JSONObject {
    /**
     * The override file type for the request.
     */
    type?: ContentType;

    /**
     * The override file format for the request.
     */
    format?: FileFormat;

    /**
     * Whether to include the file content.
     *
     * The default is `true`.
     */
    content?: boolean;
  }

  /**
   * The options used to create a file.
   */
  export
  interface ICreateOptions extends JSONObject {
    /**
     * The directory in which to create the file.
     */
     path?: string;

     /**
      * The optional file extension for the new file (e.g. `".txt"`).
      *
      * #### Notes
      * This ignored if `type` is `'notebook'`.
      */
    ext?: string;

    /**
     * The file type.
     */
    type?: ContentType;
  }

  /**
   * Checkpoint model.
   */
  export
  interface ICheckpointModel {
    /**
     * The unique identifier for the checkpoint.
     */
    readonly id: string;

    /**
     * Last modified timestamp.
     */
    readonly last_modified: string;
  }

  /**
   * The change args for a file change.
   */
  export
  interface IChangedArgs {
    /**
     * The type of change.
     */
    type: 'new' | 'delete' | 'rename' | 'save';

    /**
     * The new contents.
     */
    oldValue: IModel | null;

    /**
     * The old contents.
     */
    newValue: IModel | null;
  }

  /**
   * The interface for a contents manager.
   */
  export
  interface IManager extends IDisposable {
    /**
     * The server settings of the manager.
     */
    readonly serverSettings: ServerConnection.ISettings;

    /**
     * A signal emitted when a file operation takes place.
     */
    fileChanged: ISignal<IManager, IChangedArgs>;

    /**
     * Get a file or directory.
     *
     * @param path: The path to the file.
     *
     * @param options: The options used to fetch the file.
     *
     * @returns A promise which resolves with the file content.
     */
    get(path: string, options?: IFetchOptions): Promise<IModel>;

    /**
     * Get an encoded download url given a file path.
     *
     * @param A promise which resolves with the absolute POSIX
     *   file path on the server.
     */
    getDownloadUrl(path: string): Promise<string>;

    /**
     * Create a new untitled file or directory in the specified directory path.
     *
     * @param options: The options used to create the file.
     *
     * @returns A promise which resolves with the created file content when the
     *    file is created.
     */
    newUntitled(options?: ICreateOptions): Promise<IModel>;

    /**
     * Delete a file.
     *
     * @param path - The path to the file.
     *
     * @returns A promise which resolves when the file is deleted.
     */
    delete(path: string): Promise<void>;

    /**
     * Rename a file or directory.
     *
     * @param path - The original file path.
     *
     * @param newPath - The new file path.
     *
     * @returns A promise which resolves with the new file content model when the
     *   file is renamed.
     */
    rename(path: string, newPath: string): Promise<IModel>;

    /**
     * Save a file.
     *
     * @param path - The desired file path.
     *
     * @param options - Optional overrrides to the model.
     *
     * @returns A promise which resolves with the file content model when the
     *   file is saved.
     */
    save(path: string, options?: IModel): Promise<IModel>;

    /**
     * Copy a file into a given directory.
     *
     * @param path - The original file path.
     *
     * @param toDir - The destination directory path.
     *
     * @returns A promise which resolves with the new content model when the
     *  file is copied.
     */
    copy(path: string, toDir: string): Promise<IModel>;

    /**
     * Create a checkpoint for a file.
     *
     * @param path - The path of the file.
     *
     * @returns A promise which resolves with the new checkpoint model when the
     *   checkpoint is created.
     */
    createCheckpoint(path: string): Promise<IModel>;

    /**
     * List available checkpoints for a file.
     *
     * @param path - The path of the file.
     *
     * @returns A promise which resolves with a list of checkpoint models for
     *    the file.
     */
    listCheckpoints(path: string): Promise<ICheckpointModel[]>;

    /**
     * Restore a file to a known checkpoint state.
     *
     * @param path - The path of the file.
     *
     * @param checkpointID - The id of the checkpoint to restore.
     *
     * @returns A promise which resolves when the checkpoint is restored.
     */
    restoreCheckpoint(path: string, checkpointID: string): Promise<void>;

    /**
     * Delete a checkpoint for a file.
     *
     * @param path - The path of the file.
     *
     * @param checkpointID - The id of the checkpoint to delete.
     *
     * @returns A promise which resolves when the checkpoint is deleted.
     */
    deleteCheckpoint(path: string, checkpointID: string): Promise<void>;
  }
}


/**
 * A contents manager that passes file operations to the server.
 *
 * This includes checkpointing with the normal file operations.
 */
export
class ContentsManager implements Contents.IManager {
  /**
   * Construct a new contents manager object.
   *
   * @param options - The options used to initialize the object.
   */
  constructor(options: ContentsManager.IOptions = {}) {
    this.serverSettings = options.serverSettings || ServerConnection.makeSettings();
  }

  /**
   * A signal emitted when a file operation takes place.
   */
  get fileChanged(): ISignal<this, Contents.IChangedArgs> {
    return this._fileChanged;
  }

  /**
   * The server settings of the manager.
   */
  readonly serverSettings: ServerConnection.ISettings;

  /**
   * Test whether the manager has been disposed.
   */
  get isDisposed(): boolean {
    return this._isDisposed;
  }

  /**
   * Dispose of the resources held by the manager.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;
    Signal.clearData(this);
  }

  /**
   * Get a file or directory.
   *
   * @param path: The path to the file.
   *
   * @param options: The options used to fetch the file.
   *
   * @returns A promise which resolves with the file content.
   *
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
   */
  get(path: string, options?: Contents.IFetchOptions): Promise<Contents.IModel> {
    let url = this._getUrl(path);
    if (options) {
      // The notebook type cannot take an format option.
      if (options.type === 'notebook') {
        delete options['format'];
      }
      let params: any = JSONExt.deepCopy(options);
      params.content = options.content ? '1' : '0';
      url += URLExt.objectToQueryString(params);
    }

    let request = {
      url,
      method: 'GET',
      cache: false
    };
    return ServerConnection.makeRequest(request, this.serverSettings).then(response => {
      if (response.xhr.status !== 200) {
        throw ServerConnection.makeError(response);
      }
      try {
         validate.validateContentsModel(response.data);
       } catch (err) {
         throw ServerConnection.makeError(response, err.message);
       }
      return response.data;
    });
  }

  /**
   * Get an encoded download url given a file path.
   *
   * @param path - An absolute POSIX file path on the server.
   *
   * #### Notes
   * It is expected that the path contains no relative paths.
   */
  getDownloadUrl(path: string): Promise<string> {
    let baseUrl = this.serverSettings.baseUrl;
    return Promise.resolve(URLExt.join(baseUrl, FILES_URL,
                           URLExt.encodeParts(path)));
  }

  /**
   * Create a new untitled file or directory in the specified directory path.
   *
   * @param options: The options used to create the file.
   *
   * @returns A promise which resolves with the created file content when the
   *    file is created.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
   */
  newUntitled(options: Contents.ICreateOptions = {}): Promise<Contents.IModel> {
    let data = '{}';
    if (options) {
      if (options.ext) {
        options.ext = Private.normalizeExtension(options.ext);
      }
      data = JSON.stringify(options);
    }
    let request = {
      url: this._getUrl(options.path || ''),
      method: 'POST',
      data,
    };
    return ServerConnection.makeRequest(request, this.serverSettings).then(response => {
      if (response.xhr.status !== 201) {
        throw ServerConnection.makeError(response);
      }
      let data = response.data as Contents.IModel;
      try {
        validate.validateContentsModel(data);
      } catch (err) {
        throw ServerConnection.makeError(response, err.message);
      }
      this._fileChanged.emit({
        type: 'new',
        oldValue: null,
        newValue: data
      });
      return data;
    });
  }

  /**
   * Delete a file.
   *
   * @param path - The path to the file.
   *
   * @returns A promise which resolves when the file is deleted.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents).
   */
  delete(path: string): Promise<void> {
    let request = {
      url: this._getUrl(path),
      method: 'DELETE'
    };
    return ServerConnection.makeRequest(request, this.serverSettings).then(response => {
      if (response.xhr.status !== 204) {
        throw ServerConnection.makeError(response);
      }
      this._fileChanged.emit({
        type: 'delete',
        oldValue: { path },
        newValue: null
      });
    }, error => {
        // Translate certain errors to more specific ones.
        // TODO: update IPEP27 to specify errors more precisely, so
        // that error types can be detected here with certainty.
        if (error.xhr.status === 400) {
          let err = JSON.parse(error.xhr.response);
          if (err.message) {
            error.message = err.message;
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Rename a file or directory.
   *
   * @param path - The original file path.
   *
   * @param newPath - The new file path.
   *
   * @returns A promise which resolves with the new file contents model when
   *   the file is renamed.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
   */
  rename(path: string, newPath: string): Promise<Contents.IModel> {
    let request = {
      url: this._getUrl(path),
      method: 'PATCH',
      data: JSON.stringify({ path: newPath })
    };
    return ServerConnection.makeRequest(request, this.serverSettings).then(response => {
      if (response.xhr.status !== 200) {
        throw ServerConnection.makeError(response);
      }
      let data = response.data as Contents.IModel;
      try {
        validate.validateContentsModel(data);
      } catch (err) {
        throw ServerConnection.makeError(response, err.message);
      }
      this._fileChanged.emit({
        type: 'rename',
        oldValue: { path },
        newValue: data
      });
      return data;
    });
  }

  /**
   * Save a file.
   *
   * @param path - The desired file path.
   *
   * @param options - Optional overrides to the model.
   *
   * @returns A promise which resolves with the file content model when the
   *   file is saved.
   *
   * #### Notes
   * Ensure that `model.content` is populated for the file.
   *
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
   */
  save(path: string, options: Contents.IModel = {}): Promise<Contents.IModel> {
    let request = {
      url: this._getUrl(path),
      method: 'PUT',
      cache: false,
      data: JSON.stringify(options)
    };
    return ServerConnection.makeRequest(request, this.serverSettings).then(response => {
      // will return 200 for an existing file and 201 for a new file
      if (response.xhr.status !== 200 && response.xhr.status !== 201) {
        throw ServerConnection.makeError(response);
      }
      let data = response.data as Contents.IModel;
      try {
        validate.validateContentsModel(data);
      } catch (err) {
        throw ServerConnection.makeError(response, err.message);
      }
      this._fileChanged.emit({
        type: 'save',
        oldValue: null,
        newValue: data
      });
      return data;
    });
  }

  /**
   * Copy a file into a given directory.
   *
   * @param path - The original file path.
   *
   * @param toDir - The destination directory path.
   *
   * @returns A promise which resolves with the new contents model when the
   *  file is copied.
   *
   * #### Notes
   * The server will select the name of the copied file.
   *
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
   */
  copy(fromFile: string, toDir: string): Promise<Contents.IModel> {
    let request = {
      url: this._getUrl(toDir),
      method: 'POST',
      data: JSON.stringify({ copy_from: fromFile })
    };
    return ServerConnection.makeRequest(request, this.serverSettings).then(response => {
      if (response.xhr.status !== 201) {
        throw ServerConnection.makeError(response);
      }
      let data = response.data as Contents.IModel;
      try {
        validate.validateContentsModel(data);
      } catch (err) {
        throw ServerConnection.makeError(response, err.message);
      }
      this._fileChanged.emit({
        type: 'new',
        oldValue: null,
        newValue: data
      });
      return data;
    });
  }

  /**
   * Create a checkpoint for a file.
   *
   * @param path - The path of the file.
   *
   * @returns A promise which resolves with the new checkpoint model when the
   *   checkpoint is created.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
   */
  createCheckpoint(path: string): Promise<Contents.ICheckpointModel> {
    let request = {
      url: this._getUrl(path, 'checkpoints'),
      method: 'POST'
    };
    return ServerConnection.makeRequest(request, this.serverSettings).then(response => {
      if (response.xhr.status !== 201) {
        throw ServerConnection.makeError(response);
      }
      let data = response.data as Contents.ICheckpointModel;
      try {
        validate.validateCheckpointModel(data);
      } catch (err) {
        throw ServerConnection.makeError(response, err.message);
      }
      return data;
    });
  }

  /**
   * List available checkpoints for a file.
   *
   * @param path - The path of the file.
   *
   * @returns A promise which resolves with a list of checkpoint models for
   *    the file.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents) and validates the response model.
   */
  listCheckpoints(path: string): Promise<Contents.ICheckpointModel[]> {
    let request = {
      url: this._getUrl(path, 'checkpoints'),
      method: 'GET',
      cache: false
    };
    return ServerConnection.makeRequest(request, this.serverSettings).then(response => {
      if (response.xhr.status !== 200) {
        throw ServerConnection.makeError(response);
      }
      if (!Array.isArray(response.data)) {
        throw ServerConnection.makeError(response, 'Invalid Checkpoint list');
      }
      for (let i = 0; i < response.data.length; i++) {
        try {
        validate.validateCheckpointModel(response.data[i]);
        } catch (err) {
          throw ServerConnection.makeError(response, err.message);
        }
      }
      return response.data;
    });
  }

  /**
   * Restore a file to a known checkpoint state.
   *
   * @param path - The path of the file.
   *
   * @param checkpointID - The id of the checkpoint to restore.
   *
   * @returns A promise which resolves when the checkpoint is restored.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents).
   */
  restoreCheckpoint(path: string, checkpointID: string): Promise<void> {
    let request = {
      url: this._getUrl(path, 'checkpoints', checkpointID),
      method: 'POST'
    };
    return ServerConnection.makeRequest(request, this.serverSettings).then(response => {
      if (response.xhr.status !== 204) {
        throw ServerConnection.makeError(response);
      }
    });

  }

  /**
   * Delete a checkpoint for a file.
   *
   * @param path - The path of the file.
   *
   * @param checkpointID - The id of the checkpoint to delete.
   *
   * @returns A promise which resolves when the checkpoint is deleted.
   *
   * #### Notes
   * Uses the [Jupyter Notebook API](http://petstore.swagger.io/?url=https://raw.githubusercontent.com/jupyter/notebook/master/notebook/services/api/api.yaml#!/contents).
   */
  deleteCheckpoint(path: string, checkpointID: string): Promise<void> {
    let request = {
      url: this._getUrl(path, 'checkpoints', checkpointID),
      method: 'DELETE'
    };
    return ServerConnection.makeRequest(request, this.serverSettings).then(response => {
      if (response.xhr.status !== 204) {
        throw ServerConnection.makeError(response);
      }
    });
  }

  /**
   * Get a REST url for a file given a path.
   */
  private _getUrl(...args: string[]): string {
    let parts = args.map(path => URLExt.encodeParts(path));
    let baseUrl = this.serverSettings.baseUrl;
    return URLExt.join(baseUrl, SERVICE_CONTENTS_URL,
                       ...parts);
  }

  private _isDisposed = false;
  private _fileChanged = new Signal<this, Contents.IChangedArgs>(this);
}


/**
 * A namespace for ContentsManager statics.
 */
export
namespace ContentsManager {
  /**
   * The options used to intialize a contents manager.
   */
  export
  interface IOptions {
    /**
     * The server settings for the server.
     */
    serverSettings?: ServerConnection.ISettings;
  }
}


/**
 * A namespace for module private data.
 */
namespace Private {
  /**
   * Normalize a file extension to be of the type `'.foo'`.
   *
   * Adds a leading dot if not present and converts to lower case.
   */
  export
  function normalizeExtension(extension: string): string {
    if (extension.length > 0 && extension.indexOf('.') !== 0) {
      extension = `.${extension}`;
    }
    return extension;
  }
}
