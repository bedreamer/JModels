/**
 * 模型对象
 * */
var JModel = function (id, painter, x_offset, y_offset, width, height, style) {
    this.id = id;
    this.painter = painter;
    this.x_offset = x_offset;
    this.y_offset = y_offset;
    this.x = this.x_offset - width/2;
    this.y = this.y_offset - height/2;
    this.width = width;
    this.height = height;

    if ( style === undefined ) style = {};
    if ( style.name === undefined ) style.name = 'model_' + id;
    if ( style.showed === undefined ) style.showed = true;
    this.style = style;

    if ( style.library ) {
        this.image = this.painter.search_image(style.library);
    } else {
        this.image = undefined;
    }

    // 所有的锚点都需要注册在这里
    this.anchors = {};
    return this;
};

/**
 * 渲染函数
 * */
JModel.prototype.render = function (ctx) {
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    if ( this.image && this.image.complete ) {
        var sy = this.style.row * this.image.unit_height;
        var sx = this.style.column * this.image.unit_width;
        ctx.drawImage(this.image, sx, sy, this.image.unit_width, this.image.unit_height, this.x, this.y, this.width, this.height);
    }
};

/**
 * 生成保存锚点对象
 * */
JModel.prototype.save = function () {
    return {
        id: this.id,
        painter: this.painter.id,
        x_offset: this.x_offset,
        y_offset: this.y_offset,
        width: this.width,
        height: this.height,
        style: this.style
    }
};

/**
 * 显示模型
 * */
JModel.prototype.hide = function () {
    this.style.showed = false;
};
JModel.prototype.hidden = JModel.prototype.hide;

JModel.prototype.show = function () {
    this.style.showed = true;
};

JModel.prototype.toggle = function () {
    this.style.showed = this.style.showed === false;
};

JModel.prototype.blink = function (hz) {
};