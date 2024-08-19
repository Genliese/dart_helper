import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { LOG_INFO, LOG_ERROR } from "./log";

interface Package {
    name: string;
    root_uri: string;
    package_uri: string;
}

export class DartHelper {
    private workspace_path_: string = "";
    public static CreateHelper(extension_uri: vscode.Uri) {
        // 搜索
        const helper = new DartHelper(extension_uri);
    }
    private constructor(extension_uri: vscode.Uri) {
        this.workspace_path_ = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || "";
        // 搜索workspace_path_，搜集所有的pubspec.yaml
        let pkg_yaml_array: string[] = [];
        // 拼接路径 this.workspace_path_ 和 "pkg"
        const pkg_path = path.join(this.workspace_path_, "pkg");
        this.FindPubspeyaml(pkg_path, pkg_yaml_array);
        const package_array = this.ReadPubspecYaml(pkg_yaml_array, pkg_path);
        this.CreatePackageConfigJson(package_array);
    }

    private CreatePackageConfigJson(package_array: Package[]) {
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

    private ReadPubspecYaml(file_array: string[], pkg_path: string) {
        let package_array: Package[] = [];
        for (const file of file_array) {
            const contents = fs.readFileSync(file, "utf-8");
            LOG_INFO(`Read file: ${file}`);
            const data = yaml.load(contents) as any;
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
                let package_info: Package = {
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
    private FindPubspeyaml(dir: string, file_array: string[]) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fpath = path.join(dir, file);
            const stats = fs.statSync(fpath);
            if (stats.isDirectory()) {
                if (file != "test") {
                    this.FindPubspeyaml(fpath, file_array);
                }
            } else if (stats.isFile() && file === "pubspec.yaml") {
                file_array.push(fpath);
            }
        }
    }
}
