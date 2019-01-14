from django.shortcuts import render
from django.http import *
import json
import codecs

filename = 'save.json'


# Create your views here.
def show_editor_page(request):
    return render(request, "editor.html")


def show_preview_page(request):
    return render(request, "preview.html")


def edit_models(request):

    if request.method == 'GET':
        try:
            with codecs.open(filename, encoding='utf8') as file:
                return HttpResponse(file.read())
        except:
            return JsonResponse({})
    else:
        with codecs.open(filename, mode="w", encoding='utf8') as file:
            obj = json.loads(request.body)
            file.write(json.dumps(obj, ensure_ascii=False, indent=2))

        return JsonResponse({"status": "ok"})


def show_change_model_page(request, id):
    with codecs.open(filename, encoding='utf8') as file:
        all_models = json.loads(file.read())
        model = [model for model in all_models['models'] if model['id'] == id][0]

    if request.method == 'POST':
        print(request.POST)
        model['style']['row'] = int(request.POST['row'])
        model['style']['column'] = int(request.POST['column'])
        model['style']['library'] = int(request.POST['library'])

        with codecs.open(filename, mode="w", encoding='utf8') as file:
            file.write(json.dumps(all_models, ensure_ascii=False, indent=2))

        return HttpResponseRedirect('/')

    return render(request, "model_change_form.html", context={"model": model, "all_model": all_models})
