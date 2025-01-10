from rest_framework import serializers
from api.kanbanBoard.models import Columns, Tasks
from api.kanbanBoard.models import Cards
from api.profiles.serializers import ProfileInfoSerializer
from api.workspaces.models import Workspaces
from api.workspaces.serializers import WorkspaceLabelSerializer

class ColumnSerializer(serializers.ModelSerializer):
    class Meta:
        model = Columns
        fields = '__all__'
    
    def validate_name(self, value):
        if len(value) > 256:
            raise serializers.ValidationError('Name is too long')
        return value

class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cards
        fields = '__all__'

    def validate_name(self, value):
        if len(value) > 256:
            raise serializers.ValidationError('Name is too long')
        return value

    def validate(self, attrs):
        workspace = Workspaces.objects.get(id=self.context['workspace_id'])
        if attrs.get('assigns') != None:
            for member in attrs['assigns']:
                if member not in workspace.members.all():
                    raise serializers.ValidationError('Member not in workspace')            
        return attrs
    
    def to_representation(self, instance):
        response = super().to_representation(instance)
        response['assigns'] = ProfileInfoSerializer(instance.assigns.all(), many=True).data
        response['labels'] = WorkspaceLabelSerializer(instance.labels.all(), many=True).data
        response['tasks'] = TaskSerializer(instance.tasks_set.all(), many=True).data
        return response
    
class TaskSerializer(serializers.ModelSerializer):

    class Meta:
        model = Tasks
        fields = '__all__'
        extra_kwargs = {
            'card': {'required': False}
        }

    def validate_content(self, value):
        if len(value) > 256:
            raise serializers.ValidationError('Content is too long')
        return value