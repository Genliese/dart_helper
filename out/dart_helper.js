"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DartHelper = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const log_1 = require("./log");
class DartHelper {
    workspace_path_ = "";
    static CreateHelper(extension_uri) {
        // 搜索
        const helper = new DartHelper(extension_uri);
    }
    constructor(extension_uri) {
        this.workspace_path_ = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "";
        // 搜索workspace_path_，搜集所有的pubspec.yaml
        let pkg_yaml_array = [];
        // 拼接路径 this.workspace_path_ 和 "pkg"
        const pkg_path = path.join(this.workspace_path_, "pkg");
        this.FindPubspeyaml(pkg_path, pkg_yaml_array);
        const package_array = this.ReadPubspecYaml(pkg_yaml_array, pkg_path);
        this.CreatePackageConfigJson(package_array);
    }
    CreatePackageConfigJson(package_array) {
        const target_dir = path.join(this.workspace_path_, ".dart_tool");
        if (!fs.existsSync(target_dir)) {
            fs.mkdirSync(target_dir);
        }
        const target_file = path.join(target_dir, "package_config.json");
        const target_data = {
            configVersion: 2,
            packages: package_array.map((item) => {
                return {
                    name: item.name,
                    rootUri: item.root_uri,
                    packageUri: item.package_uri,
                };
            }),
            generated: new Date().toUTCString(),
            generator: "manual",
            generatorVersion: "2.18.0",
        };
        const target_data_str = JSON.stringify(target_data, null, 4);
        fs.writeFileSync(target_file, target_data_str);
    }
    ReadPubspecYaml(file_array, pkg_path) {
        let package_array = [];
        for (const file of file_array) {
            const contents = fs.readFileSync(file, "utf-8");
            (0, log_1.LOG_INFO)(`Read file: ${file}`);
            const data = yaml.load(contents);
            // 从pubspec.yaml中读取dependencies
            // 捕获异常，判断是否有name字段
            if (typeof data === "object" && data !== null && "name" in data) {
                const name = data["name"];
                // 计算file相对于pkg_path的路径
                const relative_path = path.relative(pkg_path, file);
                // 去掉末尾的文件名
                const relative_dir = path.dirname(relative_path);
                const root_uri = path.join("../pkg", relative_dir);
                const package_uri = "lib";
                let package_info = {
                    name: name,
                    root_uri: root_uri,
                    package_uri: package_uri,
                };
                package_array.push(package_info);
            }
        }
        return package_array;
    }
    // 递归搜索pubspec.yaml文件，保存到数组中
    FindPubspeyaml(dir, file_array) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fpath = path.join(dir, file);
            const stats = fs.statSync(fpath);
            if (stats.isDirectory()) {
                if (file != "test") {
                    this.FindPubspeyaml(fpath, file_array);
                }
            }
            else if (stats.isFile() && file === "pubspec.yaml") {
                file_array.push(fpath);
            }
        }
    }
}
exports.DartHelper = DartHelper;
//# sourceMappingURL=dart_helper.js.map