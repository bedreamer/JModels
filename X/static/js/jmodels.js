/***
 *  jmodels.js
 *  作者: 李杰
 *  报告漏洞: bedreamer@163.com
 *
 *  计划:
 *      第一阶段： jmodels.js 可以将canvas初始化为不同的大小尺寸
 *      第二阶段:  Paintboard可以将mdatabase中的模型渲染出来
 *      第三阶段: 丰富模型的风格
 *      第四阶段: 实现模型的在线编辑
 *   注意:
 *      加载顺序:
 *          model --> anchors --> link
 *
 *  版本记录
 *  v1.0
 *  解决页面动态模型的绘制问题，
 *  支持：
 *      1. 动态编辑
 *      2. 模块
 *      3. 连接点(锚点)
 *      4. 连接线(连线)
 *  设计思路：
 *     1. js 进行调用，初始化canvas为JPaintbord;
 *     2. js 调用时传入option参数指定模型数据库mdatabase
 *     3. Paintboard通过mdatabase将模型渲染在canvas上
 */


/**
 * 锚点对象，用于链接两个对象
 * @param id: 锚点ID
 * @param model: 所属模型
 * @param x_offset: 当前锚点在模型的中心点的x偏移值
 * @param y_offset: 当前锚点在模型的中心点的y偏移值
 * @param name: 锚点名称, left, top, right, bottom, center
 * @param style: 当前锚点的风格定义结构
 * */
var JAnchor = function (id, model, x_offset, y_offset, name, style) {
    this.id = id;
    this.model = model;
    this.name = name;
    model.anchors[name] = this;

    this.x_offset = x_offset;
    this.y_offset = y_offset;
    this.height = 10;
    this.width = 10;
    this.style = style;

    return this;
};
/**
 * 渲染函数
 * */
JAnchor.prototype.render = function (ctx) {
    if ( this.x === undefined || this.y === undefined ) {
        this.x = this.model.x_offset + this.x_offset - this.width/2;
        this.y = this.model.y_offset + this.y_offset - this.height/2;
    }

    ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.fillText(this.id, this.x, this.y);
};


/**
 * 生成保存锚点对象
 * */
JAnchor.prototype.save = function () {
    return {
        id: this.id,
        model: this.model.id,
        name: this.name,
        x_offset: this.x_offset,
        y_offset: this.y_offset,
        style: this.style
    }
};

/**
 * 连接线对象
 * @param id: 连接线ID
 * @param begin: 起点锚点
 * @param end: 终点锚点
 * @param style: 连接线风格
 * */
var JLink = function (id, begin, end, style) {
    this.id = id;
    this.begin = begin;
    this.end = end;
    this.style = style;
    return this;
};
/**
 * 渲染函数
 * */
JLink.prototype.render = function (ctx) {
     ctx.beginPath();
     ctx.moveTo(this.begin.x + this.begin.width/2, this.begin.y + this.begin.height/2);
     ctx.lineTo(this.end.x + this.end.width/2, this.end.y + this.end.height/2);
     ctx.stroke();
};

/**
 * 生成保存锚点对象
 * */
JLink.prototype.save = function () {
    return {
        id: this.id,
        begin: this.begin.id,
        end: this.end.id,
        style: this.style
    }
};

/**
 * 模型对象
 * */
var JModel = function (id, bord, x_offset, y_offset, width, height, style) {
    this.id = id;
    this.bord = bord;
    this.x_offset = x_offset;
    this.y_offset = y_offset;
    this.x = this.x_offset - width/2;
    this.y = this.y_offset - height/2;
    this.width = width;
    this.height = height;
    this.style = style;

    // 所有的锚点都需要注册在这里
    this.anchors = {};
    return this;
};

/**
 * 渲染函数
 * */
JModel.prototype.render = function (ctx) {
    //ctx.begin();
    ctx.strokeRect(this.x, this.y, this.width, this.height);

    // 绘制调整大小的把手
    var x = this.x_offset + this.width/2;
    var y = this.y_offset + this.height/2;
    ctx.beginPath();
    for ( var i = 1;i <= 5; i ++) {
        ctx.moveTo(x - 5 * i, y);
        ctx.lineTo(x, y - 5 * i);
    }
    ctx.stroke();

    ctx.fillText("id:"+this.id, this.x_offset - 30, this.y_offset - 10);
    ctx.fillText("x:"+this.x, this.x_offset - 30, this.y_offset - 22);
    ctx.fillText("y:"+this.y, this.x_offset - 30, this.y_offset - 34);
    ctx.fillText("id:"+this.id, this.x_offset - 30, this.y_offset - 46);
    //ctx.end();
};


/**
 * 生成保存锚点对象
 * */
JModel.prototype.save = function () {
    return {
        id: this.id,
        bord: this.bord.id,
        x_offset: this.x_offset,
        y_offset: this.y_offset,
        width: this.width,
        height: this.height,
        style: this.style
    }
};


/**
 * 画板对象
 * @param dom_id: Canvas DOM ID
 * @param width: 画板宽度
 * @param height: 画板高度
 * @param options: 画板选项
 * */
var JPaintbord = function (dom_id, width, height, options) {
    this._id_pool = 1;
    this.id = 1;
    this.dom_id = dom_id;
    this.x = 0;
    this.y = 0;
    this.width = width;
    this.height = height;
    this.options = options;
    this.editor = undefined;

    this.master = window.document.getElementById(this.dom_id).getContext('2d');
    this.dom = window.document.getElementById(this.dom_id);
    this.dom.painter = this;

    // 隐藏用于后端绘制
    var slave = document.createElement('canvas');
    slave.id = this.dom_id + '_shadow';
    slave.style.visibility = "hidden";
    this.slave = slave.getContext('2d');

    // 将主从画板设置为同样大小，方便进行图形拷贝
    this.slave.canvas.width = this.master.canvas.width = this.width;
    this.slave.canvas.height = this.master.canvas.height = this.height;

    // 链接, 最下层
    this.links_list = {};
    // 锚点, 中间层
    this.anchors_list = {};
    // 模型， 最上层
    this.models_list = {};

    // 预先从配置选项中加载对象
    this.load(options.models, options.anchors, options.links);

    /*
    * 选择slave画板
    * */
    this.begin = function () {
        this.ctx = this.slave;
    };

    /**
     * 将元素全都一次性绘制到slave画板上
     * */
    this.render = function () {
        var ctx = this.ctx;
        // 清空画布
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        for (i in this.links_list) {
            //console.log(this.links_list[i]);
            this.links_list[i].render && this.links_list[i].render(ctx);
        }

        for (i in this.anchors_list) {
            //console.log(this.anchors_list[i]);
            this.anchors_list[i].render && this.anchors_list[i].render(ctx);
        }

        for (i in this.models_list) {
            //console.log(this.models_list[i]);
            this.models_list[i].render && this.models_list[i].render(ctx);
        }
    };

    /**
     * 为了避免图像闪烁，将slave画板的内容一次性拷贝到master画板
     * */
    this.update = function () {
        this.master.clearRect(0, 0, this.width, this.height);
        this.master.drawImage(this.slave.canvas, 0, 0);
    };

    this.dom.onmousemove = function (ev) {this.painter.editor && this.painter.editor.onmousemove && this.painter.editor.onmousemove(ev);};
    this.dom.onmousedown = function (ev) {this.painter.editor && this.painter.editor.onmousedown && this.painter.editor.onmousedown(ev);};
    this.dom.onmouseup = function (ev) {this.painter.editor && this.painter.editor.onmouseup && this.painter.editor.onmouseup(ev);};
    this.dom.onclick = function (ev) {this.painter.editor && this.painter.editor.onclick && this.painter.editor.onclick(ev);};
    this.dom.ondblclick = function (ev) {this.painter.editor && this.painter.editor.ondblclick && this.painter.editor.ondblclick(ev);};

    return this;
};

/**
 * 通过具体的数据加载模型
 * */
JPaintbord.prototype.load_model = function(id, x_offset, y_offset, width, height, style) {
    this.models_list[id] = new JModel(id, this, x_offset, y_offset, width, height, style);
    this._id_pool = this._id_pool > id ? this._id_pool : id;
    return this.models_list[id];
};

/**
 * 通过具体数据加载链接
 * */
JPaintbord.prototype.load_link = function(id, begin, end, style) {
    this.links_list[id] = new JLink(id, begin, end, style);
    this._id_pool = this._id_pool > id ? this._id_pool : id;
    return this.links_list[id];
};

/**
 * 通过具体数据加载锚点
 * */
JPaintbord.prototype.load_anchor = function(id, model, x_offset, y_offset, name, style) {
    this.anchors_list[id] = new JAnchor(id, model, x_offset, y_offset, name, style);
    this._id_pool = this._id_pool > id ? this._id_pool : id;
    return this.anchors_list[id];
};

/**
 * 从JSON对象加载全部模型、锚点、链接
 * */
JPaintbord.prototype.load = function(models, anchors, links) {
    var i, len;
    if ( models ) {
        for ( i = 0, len = models.length; i < len; i ++ ) {
            var m = models[i];
            this.load_model(m.id, m.x_offset, m.y_offset, m.width, m.height, m.style);
        }
    }

    if ( anchors ) {
        for ( i = 0, len = anchors.length; i < len; i ++ ) {
            var a = anchors[i];
            this.load_anchor(a.id, this.models_list[a.model], a.x_offset, a.y_offset, a.name, a.style);
        }
    }

    if ( links ) {
        for ( i = 0, len = links.length; i < len; i ++ ) {
            var l = links[i];
            this.load_link(l.id, this.anchors_list[l.begin], this.anchors_list[l.end], l.style);
        }
    }
};

/**
 * 根据ID搜索模型
 * */
JPaintbord.prototype.search_model = function (id) {
    return this.models_list[id];
};

/**
 * 根据ID搜索链接
 * */
JPaintbord.prototype.search_link = function (id) {
    return this.links_list[id];
};

/**
 * 根据ID搜索锚点
 * */
JPaintbord.prototype.search_anrchor = function (id) {
    return this.anchors_list[id];
};
