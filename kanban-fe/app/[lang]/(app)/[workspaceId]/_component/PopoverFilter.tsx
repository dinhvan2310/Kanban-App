import { useI18n } from '@/contexts/i18n/i18nProvider';
import useDebounce from '@/hooks/useDebounce';
import { WorkSpaceType } from '@/types/WorkSpaceType';
import { ReloadOutlined } from '@ant-design/icons';
import { Avatar, Button, Checkbox, Input, Row, Space, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PopoverFilterProps {
    workspace: WorkSpaceType;
    onChangeCardName?: (value: string) => void;
    onChangeLabel?: (value: number[]) => void;
    onChangeMember?: (value: number[]) => void;
}
function PopoverFilter({
    workspace,
    onChangeCardName,
    onChangeLabel,
    onChangeMember,
}: PopoverFilterProps) {
    const pathName = usePathname();
    const i18n = useI18n(pathName.split("/")[1]);

    const [cardNameFilter, setCardNameFilter] = useState<string>('')
    const cardNameFilterDebounce = useDebounce(cardNameFilter, 500)
    const [labelFilter, setLabelFilter] = useState<number[]>([])
    const [memberFilter, setMemberFilter] = useState<number[]>([])

    useEffect(() => {
        if (onChangeCardName) {
            onChangeCardName(cardNameFilterDebounce)
        }
    }, [cardNameFilterDebounce, onChangeCardName])
    useEffect(() => {
        if (onChangeLabel) {
            onChangeLabel(labelFilter)
        }
    }, [labelFilter, onChangeLabel])
    useEffect(() => {
        if (onChangeMember) {
            onChangeMember(memberFilter)
        }
    }, [memberFilter, onChangeMember])

    return (
        <Content className='w-80'>
            <Space direction='vertical' className='w-full'>
                <Row justify={'center'} className='w-full relative'>
                    <Typography.Title level={5}>{i18n.Common['Filter']}</Typography.Title>
                    <Button type='text' icon={<ReloadOutlined />} style={{ position: 'absolute', right: 0 }}
                        onClick={() => {
                            setCardNameFilter('')
                            setLabelFilter([])
                            setMemberFilter([])
                            if (onChangeCardName) {
                                onChangeCardName('')
                            }
                            if (onChangeLabel) {
                                onChangeLabel([])
                            }
                            if (onChangeMember) {
                                onChangeMember([])
                            }
                        }}
                    />
                </Row>
                <Typography.Text strong>{i18n.Card['Filter by card name']}</Typography.Text>
                <Input placeholder='Search card name'
                    value={cardNameFilter}
                    onChange={(e) => {
                        setCardNameFilter(e.target.value)
                    }}
                />
                <Typography.Text strong>{i18n.Card['Filter by label']}</Typography.Text>
                <div className='max-h-48 overflow-y-auto flex flex-col gap-2 scrollbar dark::scrollbarDark'>
                    {workspace.labels.map((label) => (
                        <Checkbox key={label.id}
                            style={{ width: '100%' }}
                            checked={labelFilter.includes(label.id)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setLabelFilter([...labelFilter, label.id])
                                } else {
                                    setLabelFilter(labelFilter.filter((id) => id !== label.id))
                                }
                            }}
                        >
                            <div style={{
                                backgroundColor: label.color,
                                width: '100%',
                                padding: '0px 8px',
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                minHeight: 20
                            }}>
                                <div className='w-full flex justify-between items-center'>
                                    <Typography.Text style={{
                                        color: 'white',
                                        textShadow: '0px 0px 2px rgba(0, 0, 0, 0.5)'
                                    }}>
                                        {label.name}
                                    </Typography.Text>
                                </div>
                            </div>
                        </Checkbox>
                    ))}
                </div>
                <Typography.Text strong>{i18n.Card['Filter by members']}</Typography.Text>
                <Space direction='vertical'>
                    {workspace.members.map((member) => (
                        <Checkbox key={member.profile.id}
                            checked={memberFilter.includes(member.profile.id)}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setMemberFilter([...memberFilter, member.profile.id])
                                } else {
                                    setMemberFilter(memberFilter.filter((id) => id !== member.profile.id))
                                }
                            }}
                        >
                            <Space>
                                <Avatar src={member.profile.profile_pic.avatar === '' ? "/images/no_avatar.png" : member.profile.profile_pic.avatar} />
                                <div className='flex flex-col'>
                                    <Typography.Text style={{ marginBottom: 0 }}>{member.profile.name}</Typography.Text>
                                    <Typography.Text type='secondary'>{member.profile.email}</Typography.Text>
                                </div>
                            </Space>
                        </Checkbox>
                    ))}
                </Space>
            </Space>
        </Content>
    )
}

export default PopoverFilter