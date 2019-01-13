var JEditor = function (painter) {
    this.painter = painter;
    this.painter.editor = this;

    // 光标在模型修改大小象限
    this.in_resize_model_arae = false;
    // 光标在模型移动位置象限
    this.in_move_model_arae = false;

    /**
     * 在当前的模型列表终新建一个模型
     * */
    this.create_link = function (begin, end, style) {
        var id = ++ this.painter._id_pool;
        if ( typeof begin != 'object' ) {
            target = this.painter.search_anrchor(begin);
            if ( ! target ) {
                console.error("没有找到锚点", begin);
                return undefined;
            }
            begin = target;
        }
        if ( typeof end != 'object' ) {
            target = this.painter.search_anrchor(end);
            if ( ! target ) {
                console.error("没有找到锚点", end);
                return undefined;
            }
            end = target;
        }

        var link = new JLink(id, begin, end, style);
        this.painter.links_list[id] = link;
        return link;
    };

    /**
     * 在当前的模型列表终新建一个模型
     * */
    this.create_anchor = function (model, x_offset, y_offset, name, style) {
        var id = ++ this.painter._id_pool;
        if ( typeof model != 'object' ) {
            target = this.painter.search_model(model);
            if ( ! target ) {
                console.error("没有找到模型", model);
                return undefined;
            }
            model = target;
        }
        var archor = new JAnchor(id, model, x_offset, y_offset, name, style);
        this.painter.anchors_list[id] = archor;
        return archor;
    };

    /**
     * 在当前的模型列表终新建一个模型
     * */
    this.create_model = function(x_offset, y_offset, width, height, style) {
        var id = ++ this.painter._id_pool;
        var model = new JModel(id, this.painter, x_offset, y_offset, width, height, style);
        this.painter.models_list[id] = model;

        var left_anchors = this.create_anchor(model, -width/2, 0, 'left', {});
        var top_anchors = this.create_anchor(model, 0, -height/2, 'top', {});
        var right_anchors = this.create_anchor(model, width/2, 0, 'right', {});
        var bottom_anchors = this.create_anchor(model, 0, height/2, 'bottom', {});
        var center_anchors = this.create_anchor(model, 0, 0, 'center', {});

        return [model, left_anchors, top_anchors, right_anchors, bottom_anchors, center_anchors];
    };

    /**
     * 更新绘制的内容到画板
     * */
    this.update = function () {
        this.painter.begin();
        this.painter.render();
        this.painter.update();
    };
};
/**
 * 将画板中的对象保存起来
 * */
JEditor.prototype.save = function () {
    var models = [];
    var links = [];
    var anchors = [];

    for (i in this.painter.links_list) {
        links.push(this.painter.links_list[i].save())
    }

    for (i in this.painter.anchors_list) {
        anchors.push(this.painter.anchors_list[i].save())
    }

    for (i in this.painter.models_list) {
        models.push(this.painter.models_list[i].save())
    }

    var options = {
        models: models,
        links: links,
        anchors: anchors
    };

    var str = JSON.stringify(options);
    //console.log(str);

    return options;
};

/**
 * 从json对象加载到画板
 * */
JEditor.prototype.load = function (obj) {
    this.painter.load(obj.models, obj.anchors, obj.links);
};

/**
 * 选择模型
 * */
JEditor.prototype.select_model = function (ev) {
    for ( id in this.painter.models_list ) {
        var model = this.painter.models_list[id];

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

    for (name in model.anchors) {
        anchor = model.anchors[name];
        anchor.x = anchor.model.x_offset + anchor.x_offset - anchor.width/2;
        anchor.y = anchor.model.y_offset + anchor.y_offset - anchor.height/2;
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

    // left anchor
    var anchor = model.anchors.left;
    if ( anchor ) {
        anchor.x_offset = 0 - new_width / 2;
        anchor.y_offset = 0;
        anchor.x = anchor.y = undefined;
    }

    // top anchor
    anchor = model.anchors.top;
    if ( anchor ) {
        anchor.x_offset = 0;
        anchor.y_offset = - new_height / 2;
        anchor.x = anchor.y = undefined;
    }

    // right anchor
    anchor = model.anchors.right;
    if ( anchor ) {
        anchor.x_offset = new_width / 2;
        anchor.y_offset = 0;
        anchor.x = anchor.y = undefined;
    }

    // bottom anchor
    anchor = model.anchors.bottom;
    if ( anchor ) {
        anchor.x_offset = 0;
        anchor.y_offset = new_height / 2;
        anchor.x = anchor.y = undefined;
    }
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

    var delta_x = ev.offsetX - this.down_point_while_move.offsetX;
    var delta_y = ev.offsetY - this.down_point_while_move.offsetY;

    if ( this.in_move_model_arae ) {
        new_x_offset = this.model_x_offset_while_mousedown + delta_x;
        new_y_offset = this.model_y_offset_while_mousedown + delta_y;
        this.update_model_location(this.model_selected, new_x_offset, new_y_offset);
    }

    if ( this.in_resize_model_arae ) {
        new_width = this.model_width_while_mousedown + delta_x;
        new_height = this.model_height_while_mousedown + delta_y;
        this.update_model_size(this.model_selected, new_width, new_height);
    }

    this.update();
};

/***
 *
 * 鼠标按下事件
 */
JEditor.prototype.onmousedown = function (ev) {
    var model = this.select_model(ev);
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
    var model = this.select_model(ev);
    this.painter.dom.style.cursor = 'auto';
    this.model_selected = undefined;
    this.move_begin_point = undefined;
};

/***
 *
 * 鼠标单击事件
 */
JEditor.prototype.onclick = function (ev) {
    var model = this.select_model(ev);
};

/***
 *
 * 鼠标双击事件
 */
JEditor.prototype.ondblclick = function (ev) {
    var model = this.select_model(ev);
};
