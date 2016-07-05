tps.sys.RestartHTA(tps.sys.processOption.requestAdmin | tps.sys.processOption.escapeWOW64);

var G = {
    path_conf: tps.sys.GetScriptDir(),
    path_greensoft: "c:\\cloud\\soft",
    path_srcroot: tps.file.FirstExistDir(["c:\\src", "d:\\src", "e:\\src"]) || "d:\\src",
    username: shell.Environment("Process")("USERNAME"),
    path_profile: shell.Environment("Process")("USERPROFILE"),
    path_autorun: shell.SpecialFolders("Startup"),
    path_autorun_alluser: shell.SpecialFolders("AllUsersStartup")
};
G.path_softconf = "c:\\cloud\\softconf";

var GUI = {
    max_cellwidth: 0,
    cell_columns: 0
};

function SimpleRegistryTask(name, values) {
    values = [].concat(values);
    this.name = name;
    this.check = function () {
        for (var i in values) {
            var v = values[i];
            if (v.val == null) {
                if (tps.reg.GetStringValue(v.key, v.valname) == null &&
                    tps.reg.GetIntValue(v.key, v.valname) == null)
                    return false;
            }
            else if (typeof v.val === 'string') {
                if (v.val != tps.reg.GetStringValue(v.key, v.valname)) return false;
            } else {
                if (v.val != tps.reg.GetIntValue(v.key, v.valname)) return false;
            }
        }
        return true;
    };
    this.run = function () {
        var uncomplete = false;

        for (var i in values) {
            var v = values[i];
            tps.reg.CreateKey(v.key);
            if (v.val == null) {
                uncomplete = true;
            }
            else if (typeof v.val === 'string') {
                tps.reg.SetStringValue(v.key, v.valname, v.val);
            } else {
                tps.reg.SetIntValue(v.key, v.valname, v.val);
            }
        }
        if (uncomplete) {
            alert("manual configuration still needed.");
        }
    };
}

function RunAtLogonTask(name, cmdline, elevate) {
    this.name = "autostart: " + name;
    this.check = function () {
        var o = tps.sys.RunCommandAndGetResult("schtasks.exe /query /tn " + name).output;
        return o.indexOf(name) != -1;
    };
    this.run = function () {
        var cmd = 'schtasks.exe /create /sc ONLOGON /tn ' + name + ' /tr "cmd.exe /C start """' + name + '""" ' + cmdline + '"';
        if (elevate) cmd += ' /rl HIGHEST';
        alert(cmd);
        var o = tps.sys.RunCommandAndGetResult(cmd);
        alert(o.output ? o.output : o.errors);
    };
}

function AutoRunTask(name, target, args, alluser) {
    this.name = "autorun: " + name;
    this.check = function () {
        var filter = new RegExp(name, "i");
        var local = tps.file.Glob(G.path_autorun, filter, 1).length > 0;
        var global = tps.file.Glob(G.path_autorun_alluser, filter, 1).length > 0;
        return (alluser && !local && global) || (!alluser && local && !global);
    };
    this.run = function () {
        var filename = name + ".lnk";
        // first delete both
        try {
            fso.DeleteFile(G.path_autorun + "\\" + filename);
            fso.DeleteFile(G.path_autorun_alluser + "\\" + filename);
        } catch (e) { }
        // create the right one
        var dir = alluser ? G.path_autorun_alluser : G.path_autorun;
        tps.log.Event("shortcut:" + dir + "\\" + filename + " --> " + target + " " + args);
        tps.file.CreateShortcut(dir + "\\" + filename, target, "", args);
    };
}

function EnvTask(name, value) {
    this.name = "env: " + name;
    this.check = function () {
        return tps.sys.GetSystemEnv(name) == value;
    }
    this.run = function () {
        tps.sys.SetSystemEnv(name, value);
    }
}

function AddToPathTask(name, path) {
    path = [].concat(path);
    this.name = "Add " + name + " to PATH";
    this.check = function () {
        for (var i in path) {
            if (!tps.sys.InPath(tps.sys.systemEnv, path[i])) return false;
        }
        return true;
    }
    this.run = function () {
        for (var i in path) {
            tps.sys.AddToPath(tps.sys.systemEnv, path[i]);
        }
    }
}

var tasks = [

    //new AutoRunTask("handyrun", G.path_greensoft + "\\handyrun\\handyrun.exe", "", false),
    //new RunAtLogonTask("mactype", G.path_greensoft + "\\mactype\\MacTray.exe", true),
    new RunAtLogonTask("autoit", G.path_greensoft + "\\autoit\\autoit3.exe " + G.path_softconf + "\\hotkey.au3", false),
    //new AutoRunTask("autoit", G.path_greensoft + "\\autoit\\autoit3.exe", G.path_softconf + "\\hotkey.au3", false),
    //new AutoRunTask("mactype", G.path_greensoft + "\\mactype\\MacTray.exe", "", false),
    //new RunAtLogonTask("ultrasearch", G.path_greensoft + "\\ultrasearch\\ultrasearch.exe", true),
    //new EnvTask("GS", G.path_greensoft),
    //new EnvTask("SRCROOT", G.path_srcroot),
    //new EnvTask("SOFTCONF", G.path_softconf),

    {
        name: "Explorer favorites",
        check: function () {
            return tps.file.Glob(G.path_profile + "\\Links", /G40/i, 1).length > 0;
        },
        run: function () {
            tps.file.CreateShortcut(G.path_profile + "\\Links\\G40.lnk", "\\\\stcsrv-g40.fareast.corp.microsoft.com\\Share\\tongjunhui");
        }
    },

    new AddToPathTask("%GS%\\cmdline", G.path_greensoft + "\\cmdline"),
    new AddToPathTask("cygwin", G.path_greensoft + "\\cygwin\\bin"),
    new AddToPathTask("dmd", G.path_greensoft + "\\dmd2\\windows\\bin"),
    new AddToPathTask("sdtools", [
        G.path_greensoft + "\\sdtools",
        G.path_greensoft + "\\sdtools\\sdpack\\bin"
    ]),
    new SimpleRegistryTask("Explore view setting", [
        {
            key: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced",
            valname: "Hidden",
            val: 1
        },
        {
            key: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced",
            valname: "HideFileExt",
            val: 0
        }
    ]),

    new SimpleRegistryTask("Install 7zip",
                           {
                               key: "HKCR\\*\\shellex\\ContextMenuHandlers\\7-Zip",
                               valname: "",
                               val: null
                           }
                          ),

    new SimpleRegistryTask("Disable shell hotkeys",
                           {
                               key: "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced",
                               valname: "DisabledHotKeys",
                               val: "awq"
                           }
                          ),

    new SimpleRegistryTask("Emacs context menu",
                           {
                               key: "HKCR\\*\\shell\\Open With Emacs\\command",
                               valname: "",
                               val: "wscript.exe \"%GS%\\emacs\\emacs.wsf\" -n -- \"%1\"".replace("%GS%", G.path_greensoft)
                           }
                          ),

    new SimpleRegistryTask("Register .org file", [
        {
            key: "HKCU\\Software\\Classes\\EmacsClient\\shell\\open\\command",
            valname: "",
            val: "wscript.exe c:\\cloud\\soft\\emacs\\emacs.wsf -n -- \"%1\""
        },
        {
            key: "HKCU\\Software\\Classes\\.org",
            valname: "",
            val: "EmacsClient"
        },
        {
            key: "HKCU\\Software\\Classes\\EmacsClient\\DefaultIcon",
            valname: "",
            val: "c:\\cloud\\soft\\emacs\\bin\\emacs.exe"
        }
    ]),

    new SimpleRegistryTask("DisableAeroShake",
                           {
                               key: "HKCU\\Software\\Policies\\Microsoft\\Windows\\Explorer",
                               valname: "NoWindowMinimizingShortcuts",
                               val: 1
                           }
                           // need restart explorer.exe
                          ),

    {
        name: "Font Link Callback",
        // if we meet any of MSGOTHIC.TTC, MSJH.TTC, MSYH.TTC but haven't meet target CN font, we insert it
        check: function () {
            var fonts = tps.reg.EnumValues(this.keypath());
            for (var i in fonts) {
                var font = fonts[i].name;
                var val = fonts[i].valstr.split("\\0");
                for (var j in val) {
                    if (val[j].beginWithOneOf(this.targetFont())) break;
                    if (val[j].beginWithOneOf(this.cnFont())) return false;
                }
            }
            return true;
        },
        run: function () {
            var fonts = tps.reg.EnumValues(this.keypath());
            for (var i in fonts) {
                var font = fonts[i].name;
                var val = fonts[i].valstr.split("\\0");
                for (var j in val) {
                    if (val[j].beginWithOneOf(this.targetFont())) break;
                    if (val[j].beginWithOneOf(this.cnFont())) {
                        val.splice.apply(val, [j, 0].concat(this.targetFont()));
                        tps.log.Event("processing font: " + font);
                        tps.reg.SetMultiStringValue(this.keypath(), font, val);
                        break;
                    }
                }
            }
        },
        keypath: function () {
            return "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\FontLink\\SystemLink";
        },
        cnFont: function () {
            return ["msgothic.ttc", "msjh.ttc", "msyh.ttc", "simsun.ttc", "mingliu.ttc"];
        },
        targetFont: function () {
            return ["XHEI.TTC,XHei,128,96", "XHEI.TTC,XHei"];
        }
    },

    {
        name: "Font Link special",
        check: function () {
            var fontlinks = this.fontLinks();
            var fonts = tps.reg.EnumValues(this.keypath());
            for (var fontname in fontlinks) {
                var value = "";
                for (var i in fonts) {
                    if (fonts[i].name == fontname) value = fonts[i].valstr;
                }
                if (value != fontlinks[fontname].join("\\0")) return false;
            }
            return true;
        },
        run: function () {
            var fontlinks = this.fontLinks();
            for (var fontname in fontlinks) {
                tps.reg.SetMultiStringValue(this.keypath(), fontname, fontlinks[fontname]);
            }
        },
        keypath: function () {
            return "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\FontLink\\SystemLink";
        },
        fontLinks: function () {
            var qingyuan = ["QingYuan.ttc,QingYuan,128,96", "QingYuan.ttc,QingYuan"];
            return {
                "Consolas": qingyuan,
                "Source Code Pro": qingyuan,
                "Bitstream Vera Sans Mono": qingyuan
            };
        }
    },

    {
        name: "outlook url protocol",
        check: function () {
            return tps.reg.StringValueExists("HKCR\\outlook\\shell\\open\\command", null);
        },
        run: function () {
            tps.reg.SetStringValue("HKCR\\outlook", null, "URL:OutlookItem");
            tps.reg.SetStringValue("HKCR\\outlook", "URL Protocol", "");
            tps.reg.SetStringValue("HKCR\\outlook\\shell\\open\\command", null, tps.util.DoubleQuote(this.outlookpath()) + ' /select "%1"');
        },
        outlookpath: function () {
            return tps.reg.GetStringValue("HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths\\OUTLOOK.EXE", null);
        }
    },

    {
        name: "Ubuntu on Windows setup",
        check: function () {
            var bashrc = tps.file.ReadTextFileSimple(this.bashrcpath());
            return bashrc.indexOf(this.mybashpath) >= 0;
        },
        run: function() {
            var text = '\n. ' + tps.util.DoubleQuote(this.mybashpath) + '\n';
            tps.file.AppendTextFileSimple(text, this.bashrcpath());
        },
        bashrcpath: function () {
            return shell.ExpandEnvironmentStrings("%localappdata%\\lxss\\home\\timepp\\.bashrc");
        },
        mybashpath: "/mnt/c/Users/idtong/OneDrive/softconf/mybash.sh"
    }

];

var ops = [];



function Init() {
    tps.log.AddHtmlElementDevice(document.getElementById("log"));

    for (var i in tasks) {
        if (tasks[i].name) {
            ops.push(tasks[i]);
        }
    }

    var tc = document.getElementById("task_c");
    for (var i in ops) {
        var op = ops[i];
        var cell = document.createElement("span");
        cell.innerText = op.name;
        cell.className = "task_cell";
        tc.appendChild(cell);
        if (GUI.max_cellwidth < cell.offsetWidth) GUI.max_cellwidth = cell.offsetWidth;
        tc.removeChild(cell);
        op.status = false;
    }

    window.onresize = OnWindowResize;
    OnWindowResize();

    tps.log.Debug("System Information: ");
    tps.log.Indent();
    for (var x in G) {
        tps.log.Debug(x + ": " + G[x]);
    }
    tps.log.Unindent();

    for (var i in ops) {
        var op = ops[i];
        try {
            if (op.hasOwnProperty("initialize")) op.initialize();
            if (op.hasOwnProperty("check")) op.status = op_check(op);
            MarkStatus(op.cell, op.status);
        }
        catch (e) {
            var msg = e;
            if (e.hasOwnProperty("message")) msg = e.message;
            tps.log.Warning("[$T]: task check failed: $M".replace("$T", op.name).replace("$M", msg));
        }
    }

    AddGradientBK(document.getElementById("log_header"), "skyblue", "#FFFFFF");
}

function OnWindowResize() {
    RecalcLayout();
}

function RecalcLayout() {
    var oLog = document.getElementById("log");
    var tbl = document.getElementById("task_table");
    var tbl_hdr = document.getElementById("log_header");
    var cols = Math.floor(document.body.offsetWidth / GUI.max_cellwidth);
    if (cols < 1) cols = 1;
    if (cols != GUI.cell_columns) {
        GUI.cell_columns = cols;
        while (tbl.rows.length > 0) {
            tbl.deleteRow(0);
        }

        var rows = Math.ceil(ops.length / cols);
        for (var i = 0; i < rows; i++) {
            var row = tbl.insertRow(-1);
            for (var j = 0; j < cols; j++) {
                if (j * rows + i >= ops.length) continue;
                var op = ops[j * rows + i];
                var cell = row.insertCell(-1);
                cell.appendChild(document.createTextNode(op.name));
                cell.className = "task_cell";
                cell.op = op;
                cell.style.width = GUI.max_cellwidth;
                cell.onclick = OnTaskClick;
                op.cell = cell;
                MarkStatus(cell, op.status);
            }
        }
    }

    var h = document.body.offsetHeight - tbl.offsetHeight - tbl_hdr.offsetHeight - 40;
    if (h > 100) {
        oLog.style.height = h;
    }
}

function ClearLog() {
    document.getElementById("log").innerHTML = "";
}
function AddGradientBK(o, c1, c2, tp) {
    if (c2 == null) c2 = "#FFFFFF";
    if (tp == null) tp = 1;
    o.style.background = "linear-gradient(to right, %sc, %ec)".replace("%sc", c1).replace("%ec", c2).replace("%tp", tp);
}
function OnTaskClick() {
    var cell = window.event.srcElement;
    var op = cell.op;
    var has_chk_method = op.hasOwnProperty("check");
    var has_run_method = op.hasOwnProperty("run");
    if (has_chk_method) {
        if (has_run_method) {
            op_run(op);
        }
        op.status = op_check(op);
    }
    else {
        if (op.status) {
            if (confirm("Reset this task to undone?")) op.status = false;
        }
        else {
            if (has_run_method) {
                op_run(op);
                op.status = confirm("Task done but cannot check...");
            }
            else {
                op.status = confirm("$T: This task must be done manually...".replace("$T", op.name));
            }
        }
    }

    MarkStatus(cell, cell.op.status);
}
function op_run(op) {
    tps.log.Event("run task: " + op.name);
    tps.log.Indent();
    try { op.run(); } catch (e) {
        var msg = e;
        if (e.hasOwnProperty("message")) msg = e.message;
        tps.log.Warning("[$T]: failed. $M".replace("$T", op.name).replace("$M", msg));
    }
    tps.log.Unindent();
}
function op_check(op) {
    tps.log.Event("check " + op.name);
    tps.log.Indent();
    var ret = false;
    try {
        ret = op.check();
    } catch (e) {
        var msg = e;
        if (e.hasOwnProperty("message")) msg = e.message;
        tps.log.Error("task check failed: $M".replace("$T", op.name).replace("$M", msg));
    }
    tps.log.Unindent();
    return ret;
}
function MarkStatus(o, c) { AddGradientBK(o, c ? "#CCFFCC" : "#FFCCCC"); }
