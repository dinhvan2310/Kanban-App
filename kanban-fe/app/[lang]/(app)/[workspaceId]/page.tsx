'use client'
import { addCard, getCards } from '@/api/card';
import { addColumn, deleteColumn, getColumns, updateColumn } from '@/api/column';
import { getProfile } from '@/api/profile';
import { getWorkspace, moveCardCrossColumn, moveCardInTheSameColumn, moveColumn } from '@/api/workSpace';
import RenderIf from '@/components/common/RenderIf/RenderIf';
import { MultipleContainers } from '@/components/Dnd-kit/MultipleContainers/MultipleContainers';
import { useI18n } from '@/contexts/i18n/i18nProvider';
import { useWebsocket } from '@/hooks/useWebSocket';
import { accessToken } from '@/lib/http';
import { DeleteOutlined, FilterOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { UniqueIdentifier } from '@dnd-kit/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Button, Divider, Layout, message, Popover, Space, Spin, Tooltip, Typography } from 'antd';
import { Content, Header } from 'antd/es/layout/layout';
import useToken from 'antd/es/theme/useToken';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import CardItem from './_component/CardItem';
import DrawerWorkspaceSettings from './_component/DrawerWorkspaceSettings/DrawerWorkspaceSettings';
import ModalEditCard from './_component/ModalEditCard/ModalEditCard';
import PopoverFilter from './_component/PopoverFilter';

type Items = Record<UniqueIdentifier, UniqueIdentifier[]>;
interface Props {
    params: {
        workspaceId: string;
    };
}
function KanbanBoard({ params: { workspaceId } }: Props) {
    const pathName = usePathname();
    const i18n = useI18n(pathName.split("/")[1]);
    const token = useToken();
    const queryClient = useQueryClient();
    const contentRef = useRef<React.ComponentRef<typeof Content>>(null);

    // const control state
    const [openDrawerWorkspaceInfo, setOpenDrawerWorkspaceInfo] = useState(false);

    const userData = useQuery({
        queryKey: ["user"],
        queryFn: async () => {
            return getProfile();
        },
    })
    // workspace
    const workspace = useQuery({
        queryKey: ['workspace', workspaceId],
        queryFn: async () => {
            return getWorkspace(workspaceId)
        },
    })
    // Columns
    const columnsQuery = useQuery({
        queryKey: ['columns', workspaceId],
        queryFn: async () => {
            return getColumns(workspaceId)
        }
    })
    // cards
    const cardsQuery = useQuery({
        queryKey: ['cards', workspaceId],
        queryFn: async () => {
            return getCards(workspaceId)
        }
    })
    const {

    } = useWebsocket({
        url: `ws://${process.env.NEXT_PUBLIC_BASE_URL.replace(/^http:\/\//, '')}/ws/workspace/${workspaceId}/?token=${accessToken.value}`,
        trigger: workspaceId + accessToken.value,
        onMessage: (data) => {
            const message = JSON.parse(data)
            console.log('message', message)
            if (message.type === 'reload_data') {
                console.log(message.user_id !== userData.data?.id)
                if (message.user_id !== userData.data?.id) {
                    console.log('reload_data')
                    workspace.refetch()
                    columnsQuery.refetch()
                    cardsQuery.refetch()
                }
            }
        }
    })

    // state
    const [selectedCard, setSelectedCard] = useState<string>()
    const [openModalEditCard, setOpenModalEditCard] = useState(false)
    //-------------- Filter ----------------
    const [cardNameFilter, setCardNameFilter] = useState<string>('')
    const [labelFilter, setLabelFilter] = useState<number[]>([])
    const [membersFilter, setMembersFilter] = useState<number[]>([])
    const [isFilter, setIsFilter] = useState<boolean>(false)

    useEffect(() => {
        if (cardNameFilter !== '' || labelFilter.length > 0 || membersFilter.length > 0) {
            setIsFilter(true)
        } else {
            setIsFilter(false)
        }
    }, [cardNameFilter, labelFilter, membersFilter])

    useEffect(() => {
        if (columnsQuery.data && cardsQuery.data && workspace.data && workspace.data.columns_orders) {
            const items: Items = {}
            const columnOrders = workspace.data.columns_orders
            const columns = columnsQuery.data
            const cards = cardsQuery.data
            const filteredCards = cards.filter((card) => {
                // filter by card name
                if (cardNameFilter !== '' && !card.name.toLowerCase().includes(cardNameFilter.toLowerCase())) {
                    return false
                }
                if (labelFilter.length > 0 && !labelFilter.some((labelId) => card.labels.map(i => i.id).includes(labelId))) {
                    return false
                }
                if (membersFilter.length > 0 && !membersFilter.some((memberId) => card.assigns.map(i => i.id).includes(memberId))) {
                    return false
                }
                return true
            })

            columnOrders.forEach((columnId) => {
                const column = columns.find((column) => column.id === columnId)
                if (column) {
                    const cardOrders = column.card_orders
                    const cardIds: UniqueIdentifier[] = []
                    cardOrders.forEach((cardId) => {
                        const card = filteredCards.find((card) => card.id === cardId)
                        if (card) {
                            cardIds.push(card.id)
                        }
                    })
                    items[columnId] = cardIds
                }
            })
            setItems(items)
        }
    }, [columnsQuery.data, cardsQuery.data, workspace.data, workspace.data?.columns_orders, cardNameFilter, labelFilter, membersFilter])
    const [items, setItems] = useState<Items>()

    // Columns Mutations
    const createColumnMutation = useMutation({
        mutationKey: ['createColumn', workspaceId],
        mutationFn: async () => {
            const rs = await addColumn(workspaceId, 'New Column');
            message.success(i18n.Message["Column added successfully"]);
            return rs.id as UniqueIdentifier;
        },
        onSuccess: () => {
            columnsQuery.refetch()
            workspace.refetch()
        },
        onError: (error) => {
            console.log(error)
            message.error(i18n.Message["Failed to add column"]);
            columnsQuery.refetch()
            workspace.refetch()
        }
    })
    const updateColumnMutation = useMutation({
        mutationKey: ['updateColumn', workspaceId],
        mutationFn: async (values: {
            columnId: UniqueIdentifier;
            name: string;
        }) => {
            if (values.name.length >= 255) {
                message.error(i18n.Message["Column name is too long"]);
                return;
            }
            await updateColumn(
                workspaceId,
                values.columnId.toString(),
                values.name
            )
        },
        onSuccess: () => {
            columnsQuery.refetch()
        },
    })
    const deleteColumnMutation = useMutation({
        mutationKey: ['removeColumn', workspaceId],
        mutationFn: async (columnId: UniqueIdentifier) => {
            await deleteColumn(workspaceId, columnId.toString());
            return columnId;
        },
        onSuccess: () => {
            console.log('deleteColumnMutation success')
            columnsQuery.refetch()
            workspace.refetch()
        },
        onError: (error) => {
            console.log(error)
            message.error(i18n.Message["Failed to delete column"]);
            columnsQuery.refetch()
            workspace.refetch()
        }
    })
    const updateColumnOrderMutation = useMutation({
        mutationKey: ['updateColumnOrder', workspaceId],
        mutationFn: async (column_orders: string[]) => {
            await moveColumn(
                workspaceId,
                column_orders
            )
            return column_orders;
        },
        onError: (error) => {
            console.log(error)
            message.error(i18n.Message["Failed to move column"]);
            queryClient.invalidateQueries({
                queryKey: ['workspace', workspaceId],
            })
        }
    })
    // Cards Mutations
    const createCardMutation = useMutation({
        mutationKey: ['createCard', workspaceId],
        mutationFn: async (columnId: string) => {
            const rs = await addCard(workspaceId, columnId, 'New Card', '', '', undefined);
            return rs.id as UniqueIdentifier;
        },
        onSuccess: () => {
            cardsQuery.refetch()
            columnsQuery.refetch()
        },
        onError: (error) => {
            console.log(error)
            message.error(i18n.Message["Failed to add card"]);
            cardsQuery.refetch()
            columnsQuery.refetch()
        }
    })
    const updateCardOrderInTheSameColumnMutation = useMutation({
        mutationKey: ['updateCardOrderInTheSameColumn', workspaceId],
        mutationFn: async (values: {
            columnId: string;
            card_orders: string[];
        }) => {
            await moveCardInTheSameColumn(
                workspaceId,
                values.columnId,
                values.card_orders
            )
        },
        onSuccess: () => {
            columnsQuery.refetch()
        }
    })
    const updateCardOrderCrossColumnMutation = useMutation({
        mutationKey: ['updateCardOrderCrossColumn', workspaceId],
        mutationFn: async (values: {
            cardId: string;
            activeColumnId: string;
            cardOrdersActiveColumn: string[];
            overColumnId: string;
            cardOrdersOverColumn: string[];
        }) => {
            await moveCardCrossColumn(
                workspaceId,
                values.overColumnId,
                values.activeColumnId,
                values.cardOrdersOverColumn,
                values.cardOrdersActiveColumn,
                values.cardId
            )
        }
    })

    // render
    function renderItemDragOverlay(id: UniqueIdentifier) {
        const card = cardsQuery.data?.find((card) => card.id === id)
        return (
            <RenderIf condition={card !== undefined} style={{ width: '100%' }}>
                <CardItem
                    card={card!}
                />
            </RenderIf>
        )
    }

    if (workspace.isLoading || columnsQuery.isLoading || cardsQuery.isLoading) {
        return <div className='flex justify-center items-center h-full w-full'>
            <Spin size='large' />
        </div>
    }
    return (
        <Layout className='w-full h-full'>
            <Header
                style={{
                    backgroundColor: token[3].colorBgElevated,
                }}
                className="flex flex-row items-center justify-between"
            >
                <div className='flex-1 overflow-x-hidden'>
                    <Typography.Title
                        level={5}
                        style={{
                            margin: 0,
                        }}
                        ellipsis
                    >
                        {workspace.data?.name}
                    </Typography.Title>
                </div>
                <Space direction="horizontal" align="center">
                    <div className="flex">
                        <Avatar.Group max={{
                            count: 3,
                        }}>
                            {
                                workspace.data?.members.map((member) => (
                                    <Tooltip title={member.profile.name} key={member.profile.id}>
                                        <Avatar
                                            key={member.profile.id}
                                            src={member.profile.profile_pic.avatar === '' ? '/images/no_avatar.png' : member.profile.profile_pic.avatar}
                                            alt={member.profile.name}
                                        >
                                            {member.profile.name}
                                        </Avatar>
                                    </Tooltip>
                                ))
                            }
                        </Avatar.Group>
                    </div>
                    <Divider type="vertical" />
                    <Popover
                        placement='bottomLeft'
                        arrow={false}
                        trigger={'click'}
                        content={
                            <PopoverFilter
                                workspace={workspace.data!}
                                onChangeCardName={(value) => {
                                    setCardNameFilter(value)
                                }}
                                onChangeLabel={(value) => {
                                    setLabelFilter(value)
                                }}
                                onChangeMember={(value) => {
                                    setMembersFilter(value)
                                }}
                            />
                        }
                    >
                        <Button
                            variant={isFilter ? 'filled' : 'text'}
                            color={isFilter ? 'primary' : 'default'}
                            icon={
                                <FilterOutlined />
                            }
                        >
                            {i18n.Common["Filter"]}
                        </Button>
                    </Popover>
                    <Divider type="vertical" />
                    <Button
                        type="text"
                        onClick={() => setOpenDrawerWorkspaceInfo(true)}
                        icon={<InfoCircleOutlined />}
                    />
                </Space>
            </Header>
            <Content className='h-full overflow-x-auto scrollbar dark::scrollbarDark pt-3 px-2'
                id='content-workspace'
                ref={contentRef}
            >
                <RenderIf condition={items !== undefined && columnsQuery.data !== undefined && cardsQuery.data !== undefined}
                    style={{ height: '100%' }}
                >
                    {/* // Modal Edit Card */}
                    <RenderIf condition={Boolean(selectedCard)}>
                        <ModalEditCard
                            workspaceId={workspaceId}
                            cardId={selectedCard}
                            columnId={cardsQuery.data?.find((card) => card.id === selectedCard)?.column}
                            onCancel={() => {
                                setOpenModalEditCard(false)
                            }}
                            open={openModalEditCard}
                        />
                    </RenderIf>
                    {/* // Modal Edit Card */}
                    <MultipleContainers
                        columns={columnsQuery.data!}
                        disabled={isFilter}
                        renderItemDragOverlay={renderItemDragOverlay}
                        onEditContainer={async (containerId, name) => {
                            updateColumnMutation.mutateAsync({
                                columnId: containerId,
                                name: name
                            })
                        }}
                        renderItem={
                            (containerId, itemId) => {
                                const card = cardsQuery.data?.find((card) => card.id === itemId)
                                return (
                                    <RenderIf condition={Boolean(card)} style={{ width: '100%' }}>
                                        <CardItem
                                            onClick={() => {
                                                setSelectedCard(card.id)
                                                setOpenModalEditCard(true)
                                            }}
                                            card={card!}
                                        />
                                    </RenderIf>
                                )
                            }}
                        itemWrapperStyle={() => {
                            return {
                                borderRadius: 8
                            }
                        }}
                        placeholderWrapperStyle={(isDraggingOver) => {
                            return {
                                borderWidth: 1.5,
                                borderStyle: "dashed",
                                borderColor: isDraggingOver ? token[3].colorPrimary : token[3].colorBorder,
                            }
                        }}
                        // modal
                        renderPlaceholder={(isDraggingOver) => {
                            return (
                                <Space direction='vertical'>
                                    <Typography.Text type="secondary"
                                        color={isDraggingOver ? token[3].colorPrimary : token[3].colorTextSecondary}
                                    >
                                        {i18n.Column['Add column']}
                                    </Typography.Text>
                                    <Typography.Text type="secondary"
                                        color={isDraggingOver ? token[3].colorPrimary : token[3].colorTextSecondary}
                                    >
                                        {i18n.Column['Drag and drop to add column']}
                                    </Typography.Text>
                                </Space>
                            )
                        }}
                        renderContainerOptions={(containerId) => (
                            <Space direction="vertical">
                                <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    loading={deleteColumnMutation.isPending}
                                    danger={true}
                                    onClick={() => {
                                        deleteColumnMutation.mutate(containerId.toString());
                                    }}
                                    style={{
                                        width: "100%",
                                        display: "flex",
                                        justifyContent: "flex-start",
                                    }}
                                >
                                    {i18n.Column['Delete column']}
                                </Button>

                            </Space>
                        )}
                        items={items!}
                        onContainerOrdersChange={async (containers: UniqueIdentifier[]) => {
                            updateColumnOrderMutation.mutateAsync(containers as string[])
                        }}
                        onCreateContainer={async () => {
                            const rs = await createColumnMutation.mutateAsync()
                            return rs
                        }}
                        onRemoveContainer={async (containerId) => {
                            deleteColumnMutation.mutateAsync(containerId).then(() => {
                                message.success(i18n.Message["Column deleted successfully"]);
                                columnsQuery.refetch()
                                workspace.refetch()
                            }).catch((error) => {
                                console.log(error)
                                message.error(i18n.Message["Failed to delete column"]);
                                columnsQuery.refetch()
                                workspace.refetch()
                            })
                        }}
                        onCreateItem={async (containerId) => {
                            const rs = await createCardMutation.mutateAsync(containerId.toString())
                            return rs
                        }}
                        onItemOrdersChangeInSameContainer={async (containerId, card_orders) => {
                            updateCardOrderInTheSameColumnMutation.mutateAsync({
                                columnId: containerId.toString(),
                                card_orders: card_orders as string[]
                            }).catch((error) => {
                                console.log(error)
                                message.error(i18n.Message["Failed to move card"]);
                                columnsQuery.refetch()
                            })
                        }}
                        onItemOrdersChangeCrossContainer={async (cardId, activeColumnId, cardOrdersActiveColumn, overColumnId, cardOrdersOverColumn) => {
                            updateCardOrderCrossColumnMutation.mutateAsync({
                                cardId: cardId.toString(),
                                activeColumnId: activeColumnId.toString(),
                                cardOrdersActiveColumn: cardOrdersActiveColumn as string[],
                                overColumnId: overColumnId.toString(),
                                cardOrdersOverColumn: cardOrdersOverColumn as string[]
                            }).catch((error) => {
                                console.log(error)
                                message.error(i18n.Message["Failed to move card"]);
                                columnsQuery.refetch()
                                cardsQuery.refetch()
                            })
                        }}
                    />
                </RenderIf>
            </Content>
            {/* // Drawer Workspace Info */}
            <DrawerWorkspaceSettings
                open={openDrawerWorkspaceInfo}
                onClose={() => setOpenDrawerWorkspaceInfo(false)}
                workspace={workspace.data!}
            />
            {/* // Drawer Workspace Info */}
        </Layout>
    )
}

export default KanbanBoard