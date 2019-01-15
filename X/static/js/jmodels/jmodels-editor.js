let JEditor = function (painter) {
    this.painter = painter;
    this.painter.editor = this;

    // 光标在模型修改大小象限
    this.in_resize_model_arae = false;
    // 光标在模型移动位置象限
    this.in_move_model_arae = false;

    // 可编辑的最小模型宽度
    this.model_min_width = 30;
    // 可编辑的最小模型高度
    this.model_min_height = 30;

    window.requestAnimationFrame(this.animation_render);
    window.editor = this;
    return this;
};


JEditor.prototype.animation_render = function() {
    console.log(this.editor);
};


/**
 * 绘制编辑模式下的连接线补充内容
 * */
JEditor.prototype.render_link = function(ctx, link) {
};


/**
 * 绘制编辑模式下的锚点补充内容
 * */
JEditor.prototype.render_anchor = function(ctx, anchor) {
    ctx.save();
    ctx.strokeRect(anchor.x, anchor.y, anchor.width, anchor.height);
    ctx.fillStyle = 'red';
    ctx.fillText(anchor.id, anchor.x, anchor.y);
    ctx.restore();
};


/**
 * 绘制编辑模式下的模型补充内容
 * */
JEditor.prototype.render_model = function(ctx, model) {
    // 绘制调整大小的把手
    let x = model.x_offset + model.width/2;
    let y = model.y_offset + model.height/2;

    ctx.save();

    ctx.beginPath();
    for ( let i = 1; i <= 4; i ++) {
        ctx.moveTo(x - 5 * i, y);
        ctx.lineTo(x, y - 5 * i);
    }
    ctx.stroke();

    if ( this.model_selected === model ) {
        ctx.strokeStyle = 'red';
        ctx.strokeRect(model.x - 5, model.y - 5, model.width + 10, model.height + 10);
    }

    ctx.restore();

    /*
    ctx.fillText("id:"+model.id, model.x_offset - 30, model.y_offset - 10);
    ctx.fillText("x:"+model.x, model.x_offset - 30, model.y_offset - 22);
    ctx.fillText("y:"+model.y, model.x_offset - 30, model.y_offset - 34);
    ctx.fillText("W:"+model.width, model.x_offset - 30, model.y_offset - 46);
    ctx.fillText("H:"+model.height, model.x_offset - 30, model.y_offset - 58);
    */
};


/**
 * 编辑器的绘制事件
 * */
JEditor.prototype.render = function(ctx) {
    let link_list = this.painter.links_list;
    for (let idx in link_list) {
        if ( ! link_list.hasOwnProperty(idx) ) {
            continue;
        }
        this.render_link(ctx, link_list[idx]);
    }

    let anchor_list = this.painter.anchors_list;
    for (let idx in anchor_list) {
        if ( ! anchor_list.hasOwnProperty(idx) ) {
            continue;
        }
        this.render_anchor(ctx, anchor_list[idx]);
    }

    let model_list = this.painter.models_list;
    for (let idx in model_list) {
        if ( ! model_list.hasOwnProperty(idx) ) {
            continue;
        }
        this.render_model(ctx, model_list[idx]);
    }
};


/**
 * 更新绘制的内容到画板
 * */
JEditor.prototype.update = function () {
    this.painter.begin();
    this.painter.render();
    this.painter.update();
};


/**
 * 在当前的模型列表终新建一个模型
 * */
JEditor.prototype.create_link = function (begin, end, style) {
    let id = ++ this.painter._id_pool;
    if ( typeof begin != 'object' ) {
        let target = this.painter.search_anchor(begin);
        if ( ! target ) {
            console.error("没有找到锚点", begin);
            return undefined;
        }
        begin = target;
    }
    if ( typeof end != 'object' ) {
        let target = this.painter.search_anchor(end);
        if ( ! target ) {
            console.error("没有找到锚点", end);
            return undefined;
        }
        end = target;
    }

    let link = new JLink(id, begin, end, style);
    this.painter.links_list[id] = link;
    return link;
};

/**
 * 在当前的模型列表终新建一个模型
 * */
JEditor.prototype.create_anchor = function (model, x_offset, y_offset, style) {
    let id = ++ this.painter._id_pool;
    if ( typeof model != 'object' ) {
        let target = this.painter.search_model(model);
        if ( ! target ) {
            console.error("没有找到模型", model);
            return undefined;
        }
        model = target;
    }
    let anchor = new JAnchor(id, model, x_offset, y_offset, style);
    this.painter.anchors_list[id] = anchor;
    return anchor;
};

/**
 * 在当前的模型列表终新建一个模型
 * */
JEditor.prototype.create_model = function(x_offset, y_offset, width, height, style) {
    let id = ++ this.painter._id_pool;
    let name = "model_" + id;
    let model = new JModel(id, this.painter, name, x_offset, y_offset, width, height, style);
    this.painter.models_list[id] = model;

    let left_anchors = this.create_anchor(model, -width/2, 0, {name: 'left'});
    let top_anchors = this.create_anchor(model, 0, -height/2, {name: 'top'});
    let right_anchors = this.create_anchor(model, width/2, 0, {name: 'right'});
    let bottom_anchors = this.create_anchor(model, 0, height/2, {name: 'bottom'});
    let center_anchors = this.create_anchor(model, 0, 0, {name: 'center'});

    return [model, left_anchors, top_anchors, right_anchors, bottom_anchors, center_anchors];
};

/**
 * 将画板中的对象保存起来
 * */
JEditor.prototype.save = function () {
    let models = [];
    let links = [];
    let anchors = [];
    let libraries = [];

    for (let i in this.painter.image_libraries_list) {
        if ( ! this.painter.image_libraries_list.hasOwnProperty(i) ) {
            continue;
        }
        libraries.push(this.painter.image_libraries_list[i].save())
    }

    for (let i in this.painter.links_list) {
        if ( ! this.painter.links_list.hasOwnProperty(i) ) {
            continue;
        }
        links.push(this.painter.links_list[i].save())
    }

    for (let i in this.painter.anchors_list) {
        if ( ! this.painter.anchors_list.hasOwnProperty(i) ) {
            continue;
        }
        anchors.push(this.painter.anchors_list[i].save())
    }

    for (let i in this.painter.models_list) {
        if ( ! this.painter.models_list.hasOwnProperty(i) ) {
            continue;
        }
        models.push(this.painter.models_list[i].save())
    }

    return {
        models: models,
        links: links,
        anchors: anchors,
        libraries: libraries,
        width: this.painter.width,
        height: this.painter.height
    };
};

/**
 * 从json对象加载到画板
 * */
JEditor.prototype.load = function (obj) {
    this.painter.load(obj.width, obj.height, obj.models, obj.anchors, obj.links, obj.libraries);
};

/**
 * 选择模型
 * */
JEditor.prototype.select_model = function (ev) {
    for ( let id in this.painter.models_list ) {
        if ( !this.painter.models_list.hasOwnProperty(id) ) {
            continue;
        }
        let model = this.painter.models_list[id];

        if ( model.x > ev.offsetX ) {
            continue;
        }
        if ( model.x + model.width < ev.offsetX ) {
            continue;
        }
        if ( model.y > ev.offsetY ) {
            continue;
        }
        if ( model.y + model.height < ev.offsetY ) {
            continue;
        }

        if ( ev.offsetX > model.x_offset && ev.offsetY > model.y_offset ) {
            this.in_resize_model_arae = true;
            this.in_move_model_arae = false;
        } else {
            this.in_resize_model_arae = false;
            this.in_move_model_arae = true;
        }

        return model;
    }
};

/**
 * 更新模型的位置
 **/
JEditor.prototype.update_model_location = function(model, new_x_offset, new_y_offset) {
    model.x_offset = new_x_offset;
    model.y_offset = new_y_offset;
    model.x = model.x_offset - model.width/2;
    model.y = model.y_offset - model.height/2;

    for (let name in model.anchors) {
        if ( model.anchors.hasOwnProperty(name) ) {
            let anchor = model.anchors[name];
            anchor.x = anchor.model.x_offset + anchor.x_offset - anchor.width / 2;
            anchor.y = anchor.model.y_offset + anchor.y_offset - anchor.height / 2;
        }
    }
};


/**
 * 更新模型的大小
 **/
JEditor.prototype.update_model_size = function(model, new_width, new_height) {
    model.width = new_width;
    model.height = new_height;

    // 固定中心点不变
    model.x = model.x_offset - model.width/2;
    model.y = model.y_offset - model.height/2;

    function relocation_anchor(model, anchor, x_offset, y_offset) {
        anchor.x_offset = x_offset;
        anchor.y_offset = y_offset;
        anchor.x = model.x_offset + anchor.x_offset - anchor.width/2;
        anchor.y = model.y_offset + anchor.y_offset - anchor.height/2;
    }

    // left anchor
    let anchor = model.anchors.left;
    anchor && relocation_anchor(model, anchor, - new_width / 2, 0);

    // top anchor
    anchor = model.anchors.top;
    anchor && relocation_anchor(model, anchor, 0, - new_height / 2);

    // right anchor
    anchor = model.anchors.right;
    anchor && relocation_anchor(model, anchor, new_width / 2, 0);

    // bottom anchor
    anchor = model.anchors.bottom;
    anchor && relocation_anchor(model, anchor, 0, new_height / 2);
};


/***
 *
 * 鼠标移动事件
 */
JEditor.prototype.onmousemove = function (ev) {
    if ( ! this.down_point_while_move ) {
        return;
    }

    if ( ! this.model_selected ) {
        return;
    }

    let delta_x = ev.offsetX - this.down_point_while_move.offsetX;
    let delta_y = ev.offsetY - this.down_point_while_move.offsetY;

    if ( this.in_move_model_arae ) {
        let new_x_offset = this.model_x_offset_while_mousedown + delta_x;
        let new_y_offset = this.model_y_offset_while_mousedown + delta_y;
        this.update_model_location(this.model_selected, new_x_offset, new_y_offset);
    }

    if ( this.in_resize_model_arae ) {
        let new_width = this.model_width_while_mousedown + delta_x;
        if ( new_width <= 20 ) {
            new_width = 20;
        }
        let new_height = this.model_height_while_mousedown + delta_y;
        if ( new_height <= 20 ) {
            new_height = 20;
        }
        this.update_model_size(this.model_selected, new_width, new_height);
    }

    this.update();
};

/***
 *
 * 鼠标按下事件
 */
JEditor.prototype.onmousedown = function (ev) {
    let model = this.select_model(ev);
    if ( model ) {
        this.down_point_while_move = ev;
        this.model_selected = model;

        this.model_x_offset_while_mousedown = model.x_offset;
        this.model_y_offset_while_mousedown = model.y_offset;

        this.model_width_while_mousedown = model.width;
        this.model_height_while_mousedown = model.height;

        if ( this.in_move_model_arae ) {
            this.painter.dom.style.cursor = 'move';
        }

        if ( this.in_resize_model_arae ) {
            this.painter.dom.style.cursor = 'nw-resize';
        }
    }
};

/***
 *
 * 鼠标弹起事件
 */
JEditor.prototype.onmouseup = function (ev) {
    let model = this.select_model(ev);

    if ( this.model_selected !== undefined ) {
        this.update();
    }

    this.painter.dom.style.cursor = 'auto';
    this.model_selected = undefined;
    this.move_begin_point = undefined;
};

/***
 *
 * 鼠标单击事件
 */
JEditor.prototype.onclick = function (ev) {
    //let model = this.select_model(ev);
};

/***
 *
 * 鼠标双击事件
 */
JEditor.prototype.ondblclick = function (ev) {
    let model = this.select_model(ev);
    if ( model !== undefined ) {
        let href = '/model/' + model.id.toString() + '/change/';
        console.log(href);
        window.location.href = href;
    }
};
