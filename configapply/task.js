function InitTasks()
{
	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "关闭系统还原";
	// TODO 寻找检查和关闭系统还原的有效方法
	op.check = function ()
	{
		var rs = WMI("default").InstancesOf("SystemRestore");
		return rs.Count == 0;
	};
	op.run = function()
	{
		var sr = WMI("default").Get("SystemRestore");
		var func = sr.Methods_.item("Disable");
		var param = func.InParameters.SpawnInstance_();
		param.Drive = "C:\\";
		var ret = sr.ExecMethod_(func.Name, param);
	};

	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "把Everything加入计划任务";
	op.check = function ()
	{
    	var items = WMI("cimv2").ExecQuery("Select * from Win32_ScheduledJob");
    	if (!items || items.Count == 0) return null;
		var e = new Enumerator(items);
		for (; !e.atEnd(); e.moveNext()) {
			alert("ccc");
			var x = e.item();
			alert(x.Name);
			if (x.Name == "everything") return true;
		}
		return false;
	}



	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "安装VS2005, sp1";
	op.check = function()
	{
		return RegIsStringValueExist(HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\VisualStudio\\8.0", "InstallDir");
	};


	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "把autoit放入启动组";
	op.check = function()
	{
		if (Glob(fso.GetFolder(G.path_autorun), /autoit/i).length > 0) return true;
		if (Glob(fso.GetFolder(G.path_autorun_alluser), /autoit/i).length > 0) return true;
		return false;
	};
	op.run = function()
	{
		var dir = G.path_greensoft + "\\psoft\\AutoIt";
		CreateLnk(G.path_autorun_alluser + "\\AutoIt.lnk", dir + "\\AutoIt3.exe", dir, "\"hotkey.au3\"");
		return true;
	};


	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "把handyrun放入启动组";
	op.check = function()
	{
		if (Glob(fso.GetFolder(G.path_autorun), /handyrun/i).length > 0) return true;
		if (Glob(fso.GetFolder(G.path_autorun_alluser), /handyrun/i).length > 0) return true;
		return false;
	};
	op.run = function()
	{
		var dir = G.path_greensoft + "\\HandyRun";
		CreateLnk(G.path_autorun_alluser + "\\HandyRun.lnk", dir + "\\HandyRun.exe", dir);
		return true;
	};


	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "安装字体Monaco";
	op.fonts = ["MONACO.ttf"];
	op.check = function()
	{
		var shell_dir = shellapp.namespace(SHN_FONTS);
		var dir = shell_dir.Self.Path;
		for (var i = 0; i < this.fonts.length; i++)
		{
			if (!fso.FileExists(dir + "\\" + this.fonts[i])) return false;
		}
		return true;
	};
	op.run = function() 
	{
		var font_dir = shellapp.namespace(SHN_FONTS);
		for (var i = 0; i < this.fonts.length; i++)
		{
			font_dir.CopyHere(G.path_conf + "\\字体\\" + this.fonts[i]);
		}
		return true;
	};


	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	//ops.push(op);
	op.name = "安装sky drive";
	op.check = function()
	{
		return RegIsStringValueExist(HKEY_LOCAL_MACHINE, "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\{DCB4E1D9-B187-4B54-971E-1478485C9A53}", "DisplayName");
	};

	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "设置路径";
	op.pathToAdd = "%GS%\\cmdline;".replace(/%GS%/g, G.path_greensoft);
	op.check = function()
	{
		return IsInPathEnv(this.pathToAdd);
	};
	op.run = function()
	{
		return ChangePathEnv(this.pathToAdd, "");
	};


	//////////////////////////////////////////////////////////////////////////
	var op = { name:"设置环境变量" };
	var prompt = "$T $P$_$G ";
	ops.push(op);
	op.check = function() 
	{
		return GetEnv("GS") == G.path_greensoft &&
		       GetEnv("PROMPT") == prompt;
	};
	op.run = function()
	{
		SetEnv("GS", G.path_greensoft);
		SetEnv("PROMPT", prompt);
	};

	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	//ops.push(op);
	op.name = "安装输入法";
	op.check = function()
	{
		// 海峰或其它?
		if (fso.GetFolder("C:\\Program Files\\freeime")) return true;

		return false;
	};

	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "安装office";
	op.check = function()
	{
	    var locations = [
		"{20150000-002A-0000-1000-0000000FF1CE}"
	    ];
	    for (var i in locations) {
		var key = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\" + locations[i];
		if (RegIsStringValueExist(HKEY_LOCAL_MACHINE, key, "DisplayName")) return true;
	    }
	    return false;
	};

	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "设置始终显示托盘图标";
	op.check = function()
	{
		var val = RegGetDWORDValue(HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer", "EnableAutoTray");
		return val == 0;
	};
	op.run = function()
	{
		RegSetDWORDValue(HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer", "EnableAutoTray", 0);
		alert("操作已成功，但是不能即时反映出效果。需要重启explorer.exe才能生效。");
		return true;
	};

	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "激活windows";


	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "安装flash player";
	op.check = function()
	{
		return RegIsStringValueExist(HKEY_LOCAL_MACHINE, "SOFTWARE\\Macromedia\\FlashPlayerActiveX", "Path");
	};

	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "在资源管理器里显示文件扩展名";
	op.check = function()
	{
		var val = RegGetDWORDValue(HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", "HideFileExt");
		return val == 0;
	};
	op.run = function()
	{
		RegSetDWORDValue(HKEY_CURRENT_USER, "Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced", "HideFileExt", 0);
		return true;
	};

	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "normal.dotm中加入常用style";


	//////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "导入VC配置";

    //////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "emacs注册表设置";
	op.check = function () {
	    return RegIsStringValueExist(HKEY_CURRENT_USER, "SOFTWARE\\GNU\\emacs", "emacs.geometry");
	}

    //////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "emacs APPDATA设置";


    //////////////////////////////////////////////////////////////////////////
	var op = new Object;
	ops.push(op);
	op.name = "重定义文档、图片、下载等位置";

} // end function InitTasks
