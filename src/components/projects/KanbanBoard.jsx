import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { api } from '../../lib/api';
import { Plus, MoreVertical, Calendar, User, CheckCircle } from 'lucide-react';

const KanbanBoard = ({ projectId }) => {
    const [tasks, setTasks] = useState({
        todo: [],
        in_progress: [],
        review: [],
        completed: []
    });
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const loadTasks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.tasks.getByProject(projectId);

            // Organize tasks by status
            const organized = {
                todo: [],
                in_progress: [],
                review: [],
                completed: []
            };

            data.forEach(task => {
                const status = task.status || 'todo';
                if (organized[status]) {
                    organized[status].push(task);
                } else {
                    organized.todo.push(task); // Fallback
                }
            });

            setTasks(organized);
        } catch (error) {
            console.error('Failed to load tasks', error);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const onDragEnd = async (result) => {
        if (!result.destination) return;

        const { source, destination, draggableId } = result;

        if (source.droppableId === destination.droppableId) {
            // Reordering within same column (just UI update for now, backend could support order)
            const column = tasks[source.droppableId];
            const newColumn = Array.from(column);
            const [removed] = newColumn.splice(source.index, 1);
            newColumn.splice(destination.index, 0, removed);

            setTasks({
                ...tasks,
                [source.droppableId]: newColumn
            });
            return;
        }

        // Moving between columns
        const sourceColumn = tasks[source.droppableId];
        const destColumn = tasks[destination.droppableId];
        const sourceItems = Array.from(sourceColumn);
        const destItems = Array.from(destColumn);
        const [removed] = sourceItems.splice(source.index, 1);

        // Optimistic update
        const newStatus = destination.droppableId;
        const updatedTask = { ...removed, status: newStatus };
        destItems.splice(destination.index, 0, updatedTask);

        setTasks({
            ...tasks,
            [source.droppableId]: sourceItems,
            [destination.droppableId]: destItems
        });

        // API Call
        try {
            await api.tasks.update(draggableId, { status: newStatus });
        } catch (error) {
            console.error('Failed to update task status', error);
            // Revert on failure (could implement robust revert logic here)
            loadTasks();
        }
    };

    const addTask = async (taskData) => {
        try {
            const newTask = await api.tasks.create(projectId, taskData);
            setTasks(prev => ({
                ...prev,
                todo: [newTask, ...prev.todo]
            }));
            setShowAddModal(false);
        } catch (error) {
            console.error('Failed to create task', error);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Loading board...</div>;

    const columns = [
        { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
        { id: 'in_progress', title: 'In Progress', color: 'bg-blue-50' },
        { id: 'review', title: 'Review', color: 'bg-purple-50' },
        { id: 'completed', title: 'Done', color: 'bg-green-50' }
    ];

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Project Tasks</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                >
                    <Plus size={18} />
                    Add Task
                </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex gap-4 overflow-x-auto pb-4 h-full">
                    {columns.map(col => (
                        <div key={col.id} className={`w-80 flex-shrink-0 flex flex-col rounded-xl ${col.color} p-4`}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-gray-700">{col.title}</h3>
                                <div className="bg-white/50 px-2 py-1 rounded text-sm font-medium text-gray-500">
                                    {tasks[col.id]?.length || 0}
                                </div>
                            </div>

                            <Droppable droppableId={col.id}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className="flex-1 overflow-y-auto space-y-3 min-h-[100px]"
                                    >
                                        {tasks[col.id]?.map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-medium text-gray-800 line-clamp-2">{task.title}</h4>
                                                            <button className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <MoreVertical size={16} />
                                                            </button>
                                                        </div>

                                                        {task.description && (
                                                            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{task.description}</p>
                                                        )}

                                                        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                                {task.due_date && (
                                                                    <div className={`flex items-center gap-1 ${new Date(task.due_date) < new Date() ? 'text-red-400' : ''}`}>
                                                                        <Calendar size={12} />
                                                                        {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {task.assignee_name && (
                                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs text-primary font-medium" title={task.assignee_name}>
                                                                    {task.assignee_name.charAt(0)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>

            {showAddModal && (
                <AddTaskModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={addTask}
                />
            )}
        </div>
    );
};

const AddTaskModal = ({ onClose, onAdd }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [priority, setPriority] = useState('medium');

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd({ title, description, dueDate, priority });
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Add New Task</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="e.g. Design Homepage"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-24"
                            placeholder="Details about the task..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Add Task</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default KanbanBoard;
